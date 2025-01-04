import { useState, useEffect, useRef } from "react";
import {
  Input,
  Text,
  Box,
  Flex,
  Circle,
  useToast,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { IconSearch, IconSend, IconDotsVertical } from "@tabler/icons-react";
import Api from "../../api";
import { Message, ChatResponse } from "../../interfaces";
import ChatHistory from "./components/ChatHistory";
import LoadingMessage from "./components/LoadingMessage";
import EmailModal from "./components/EmailModal";
import PersonalityQuestionnaire from "./components/PersonalityQuestionnaire";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const cardBodyRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<{ id: number; title: string }[]>([]);
  const toast = useToast();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [personalityData, setPersonalityData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedChatId) {
      fetchChatMessages(selectedChatId);
    }
  }, [selectedChatId]);

  useEffect(() => {
    const fetchInitialChats = async () => {
      try {
        const teamId = localStorage.getItem('team_id');
        if (!teamId) {
          console.error("No team ID found in localStorage");
          return;
        }
        console.log("Loading chats for team:", teamId);
        const response = await Api.getConversations();
        console.log("Loaded chats:", response);
        if (response && response.length > 0) {
          setChatHistory(response);
          // Select the first chat by default
          setSelectedChatId(response[0].id);
        }
      } catch (error) {
        console.error("Error fetching initial chats:", error);
      }
    };

    const teamId = localStorage.getItem('team_id');
    if (teamId) {
      fetchInitialChats();
    }
  }, []);

  // Add a listener for storage changes to handle team ID updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'team_id') {
        const fetchChats = async () => {
          try {
            const response = await Api.getConversations();
            setChatHistory(response || []);
          } catch (error) {
            console.error("Error fetching chats after team change:", error);
          }
        };
        fetchChats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (messages.length === 1 && !userEmail && !isEmailModalOpen && !isQuestionnaireOpen) {
      setIsEmailModalOpen(true);
    }
  }, [messages.length, userEmail, isEmailModalOpen, isQuestionnaireOpen]);

  async function fetchChatMessages(chatId: number) {
    try {
      const response = await Api.getMessagesByConversationId(chatId.toString());
      setMessages(response);
    } catch (error) {
      console.error("Error al cargar mensajes", error);
      toast({
        title: "Error al cargar mensajes",
        description: "No se pudieron cargar los mensajes del chat. Por favor, inténtalo de nuevo.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }

  function formatMessageText(text: string): JSX.Element {
    const headerText = text.replace(/###+ (.+)/g, '<h2>$1</h2>').replace(/## (.+)/g, '<h2>$1</h2>');
    const formattedText = headerText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  }

  async function createNewChat(title: string) {
    try {
      const teamId = localStorage.getItem('team_id');
      if (!teamId) {
        throw new Error("No hay equipo seleccionado. Por favor, inténtalo de nuevo.");
      }

      const response = await Api.createConversation(title, teamId, "1");
      const newChatId = response.id;

      setChatHistory((prev) => [...prev, { id: newChatId, title }]);
      setSelectedChatId(newChatId);
      return newChatId;
    } catch (error) {
      console.error("Error al crear chat", error);
      toast({
        title: "Error al crear chat",
        description: "No se pudo crear un nuevo chat. Por favor, inténtalo de nuevo.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }

  async function sendTextToChatBot(text: string) {
    if (!userEmail || Object.keys(personalityData).length === 0) {
      if (!userEmail) {
        setIsEmailModalOpen(true);
      } else if (Object.keys(personalityData).length === 0) {
        setIsQuestionnaireOpen(true);
      }
      return;
    }

    setIsLoading(true);

    const userMessage: Message = { content: text, role: "human" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    try {
      let chatId = selectedChatId;
  
      if (!chatId) {
        chatId = await createNewChat(text.trim()); 
        setSelectedChatId(chatId);
      }
  
      if (chatId === null || typeof chatId !== "number") {
        throw new Error("ID de chat inválido");
      }        

      const data: ChatResponse = await Api.sendTextToChatBot(text, chatId);
      const botMessage: Message = { content: data.completion, role: "bot" };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error al enviar mensaje al chatbot", error);
      const errorMessage: Message = { content: "Error al procesar tu solicitud", role: "bot" };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      sendTextToChatBot(message);
      setMessage("");
    }
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && message.trim()) {
      event.preventDefault();
      setMessage(""); 
      await sendTextToChatBot(message); 
    }
  };

  useEffect(() => {
    if (cardBodyRef.current) {
      cardBodyRef.current.scrollTop = cardBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId);
  };

  const handleEmailSubmit = (email: string) => {
    setUserEmail(email);
    setIsEmailModalOpen(false);
    setIsQuestionnaireOpen(true);
  };

  const handleQuestionnaireSubmit = (data: Record<string, string>) => {
    setPersonalityData(data);
    setIsQuestionnaireOpen(false);
    if (message.trim() !== "") {
      sendTextToChatBot(message);
      setMessage("");
    }
  };

  return (
    <Box w="100%" h="100%" bgGradient="linear(to-b, #0F1117, #1A1D27)" borderRadius="3xl" overflow="hidden">
      <Flex h="100%">
        {/* Chat List */}
        <Box 
          w="260px" 
          h="100%" 
          bg="rgba(255,255,255,0.03)"
        >
          <Flex direction="column" h="100%">
            <Box flex="1" overflowY="auto">
              <ChatHistory 
                onSelectChat={handleSelectChat} 
                chatHistory={chatHistory} 
                setChatHistory={setChatHistory} 
              />
            </Box>
          </Flex>
        </Box>

        {/* Main Chat Area */}
        <Box flex="1" h="100%" bg="transparent">
          <Flex direction="column" h="100%">
            {/* Header */}
            <Flex 
              px={4} 
              py={3} 
              align="center"
              justify="space-between"
              bg="rgba(255,255,255,0.03)"
              backdropFilter="blur(20px)"
            >
              <Flex align="center" gap={3}>
                <Circle 
                  size="40px"
                  bg="#1A1D27"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  position="relative"
                >
                  <Text fontSize="xl" position="relative" zIndex={1}>📊</Text>
                </Circle>
                <Box>
                  <Text 
                    color="white" 
                    fontWeight="600" 
                    fontSize="22px"
                    letterSpacing="-0.02em"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display'"
                  >
                  ProSkillify
                  </Text>
                  <Text 
                    color="whiteAlpha.800" 
                    fontSize="16px"
                    letterSpacing="-0.02em"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display'"
                    fontWeight="500"
                  >
                   Skill Assessment
                  </Text>
                </Box>
              </Flex>
              <HStack spacing={2}>
                <IconButton
                  aria-label="Buscar"
                  icon={<IconSearch size={16} />}
                  variant="ghost"
                  color="whiteAlpha.600"
                  _hover={{ bg: "whiteAlpha.100" }}
                  size="sm"
                />
                <IconButton
                  aria-label="Más"
                  icon={<IconDotsVertical size={16} />}
                  variant="ghost"
                  color="whiteAlpha.600"
                  _hover={{ bg: "whiteAlpha.100" }}
                  size="sm"
                />
              </HStack>
            </Flex>

            {/* Mensajes */}
            <Box 
              flex="1" 
              overflowY="auto" 
              px={4}
              py={4}
              ref={cardBodyRef}
            >
              <Flex direction="column" gap={4}>
                {messages.map((message, index) => (
                  <Flex
                    key={index}
                    justify={message.role === "human" ? "flex-end" : "flex-start"}
                    gap={3}
                    w="100%"
                  >
                    {message.role === "bot" && (
                      <Circle 
                        size="36px"
                        bgGradient="linear(to-r, #0EA5E9, #06B6D4)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        position="relative"
                        overflow="hidden"
                      >
                        <Box
                          position="absolute"
                          top="0"
                          left="0"
                          right="0"
                          bottom="0"
                          bgGradient="linear(to-r, #0EA5E9, #06B6D4)"
                          filter="blur(8px)"
                          opacity="0.5"
                          borderRadius="full"
                        />
                        <Text fontSize="lg" position="relative" zIndex={1}>📊</Text>
                      </Circle>
                    )}
                    <Box
                      maxW={{ base: "85%", md: "65%" }}
                      bg={message.role === "human" ? "rgba(14, 165, 233, 0.9)" : "rgba(255,255,255,0.03)"}
                      color={message.role === "human" ? "white" : "whiteAlpha.900"}
                      px={6}
                      py={4}
                      borderRadius="3xl"
                      position="relative"
                      boxShadow={message.role === "human" ? "0 4px 12px rgba(14, 165, 233, 0.15)" : "none"}
                      backdropFilter="blur(10px)"
                    >
                      <Text 
                        lineHeight="1.5"
                        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display'"
                        fontWeight="500"
                        letterSpacing="-0.02em"
                        fontSize="17px"
                        sx={{
                          '& strong': {
                            fontWeight: "600",
                            color: message.role === "human" ? "white" : "#0EA5E9",
                            fontSize: "17px"
                          },
                          '& h2': {
                            fontSize: "20px",
                            fontWeight: "600",
                            marginBottom: "12px",
                            color: message.role === "human" ? "white" : "#0EA5E9",
                            letterSpacing: "-0.02em"
                          }
                        }}
                      >
                        {formatMessageText(message.content)}
                      </Text>
                    </Box>
                    {message.role === "human" && (
                      <Circle 
                        size="36px"
                        bgGradient="linear(to-r, #0EA5E9, #06B6D4)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        position="relative"
                        overflow="hidden"
                      >
                        <Box
                          position="absolute"
                          top="0"
                          left="0"
                          right="0"
                          bottom="0"
                          bgGradient="linear(to-r, #0EA5E9, #06B6D4)"
                          filter="blur(8px)"
                          opacity="0.5"
                          borderRadius="full"
                        />
                        <Text fontSize="lg" position="relative" zIndex={1}>👤</Text>
                      </Circle>
                    )}
                  </Flex>
                ))}
              </Flex>
              {isLoading && <LoadingMessage />}
            </Box>

            {/* Área de entrada */}
            <Box 
              p={4}
              bg="#0F1117"
              borderTop="none"
            >
              <Flex 
                gap={2} 
                align="center"
                bg="#1A1D27"
                p={3}
                borderRadius="2xl"
                position="relative"
                _hover={{
                  bg: "#1E2231"
                }}
                transition="all 0.2s"
                border="none"
                boxShadow="none"
              >
                <Input
                  value={message}
                  placeholder="Escribe tu mensaje..."
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  variant="unstyled"
                  color="white"
                  _placeholder={{ color: "whiteAlpha.400" }}
                  fontSize="17px"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display'"
                  fontWeight="500"
                  letterSpacing="-0.02em"
                  border="none"
                  _focus={{ boxShadow: "none" }}
                  pl={4}
                />
                <IconButton
                  aria-label="Enviar"
                  icon={<IconSend size={16} />}
                  bgGradient="linear(to-r, #0EA5E9, #06B6D4)"
                  color="white"
                  _hover={{ 
                    bgGradient: "linear(to-r, #0891B2, #0E7490)",
                    transform: "translateY(-1px)",
                  }}
                  size="sm"
                  onClick={handleSendMessage}
                  isLoading={isLoading}
                  borderRadius="full"
                  border="none"
                />
              </Flex>
            </Box>
          </Flex>
        </Box>
      </Flex>
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSubmit={handleEmailSubmit}
      />
      <PersonalityQuestionnaire
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        onSubmit={handleQuestionnaireSubmit}
      />
    </Box>
  );
}

export default Chat;