import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  Text,
  Box,
  Flex,
  Circle,
  useToast,
} from "@chakra-ui/react";
import { IconRobot, IconUser } from "@tabler/icons-react";
import Api from "../../api";
import { Message, ChatResponse } from "../../interfaces";
import ChatHistoryTraining from "./components/AgentTrainingHistory";
import LoadingMessage from "./components/AgentTrainingLoadingMessage";
import { useTeam } from "../../contexts/TeamContext";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const cardBodyRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { team } = useTeam();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatHistoryTraining, setChatHistoryTraining] = useState<{ id: number; title: string }[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (selectedChatId) {
      fetchChatMessages(selectedChatId);
    }
  }, [selectedChatId]);

  async function fetchChatMessages(chatId: number) {
    try {
      await Api.getTrainingMessagesByConversationId(chatId.toString()).then((response) => {
        setMessages(response);
      });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  }

  function formatMessageText(text: string): JSX.Element {
    const headerText = text.replace(/###+ (.+)/g, '<h2>$1</h2>').replace(/## (.+)/g, '<h2>$1</h2>');
    const formattedText = headerText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  }

  async function createNewChat(title: string) {
    try {
      if (!team) {
        throw new Error("No team selected. Please select a team first.");
      }

      const response = await Api.createTrainerConversation(title, team.id.toString(), "1");
      const newChatId = response.id;

      setChatHistoryTraining((prev) => [...prev, { id: newChatId, title }]);
      setSelectedChatId(newChatId);
      return newChatId;
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast({
        title: "Error creating chat",
        description: "Failed to create a new chat. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }

  async function sendTextToTrainerChatBot(text: string) {
    setIsLoading(true);
    setMessages((prevMessages) => [...prevMessages, { content: text, role: "human" }]);
    
    try {
      let chatId = selectedChatId;

      if (!chatId) {
        // Ensure createNewChat returns a number
        chatId = await createNewChat(text.trim()); 
        setSelectedChatId(chatId); // Update state with the new chat ID
      }

      // Ensure chatId is a number before proceeding
      if (chatId === null || typeof chatId !== "number") {
        throw new Error("Invalid chat ID");
      }        
        const data: ChatResponse = await Api.sendTextToTrainerChatBot(text, chatId);
      
      const newMessages: Message[] = [
        { content: data.completion, role: "bot" }
      ];

      setMessages((prevMessages) => [...prevMessages, ...newMessages]);
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      setMessages((prevMessages) => [...prevMessages, { content: "Error processing your request", role: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      sendTextToTrainerChatBot(message);
      setMessage("");
    }
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && message.trim()) {
      event.preventDefault();
      setMessage(""); // Clear the input field
      await sendTextToTrainerChatBot(message); // Use sendTextToChatBot directly
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

  return (
    <Box w="100%" h="100%" bg="#1A1B1E" 
      borderTopLeftRadius="xl"
      borderBottomLeftRadius="xl"
      borderTopRightRadius="xl"
      borderBottomRightRadius="xl"
    >
      <Flex h="100%" maxW="1600px" mx="auto">
        {/* Main Chat Area */}
        <Box 
          flex="1" 
          h="100%" 
          bg="#1A1B1E"
          display={{ base: !selectedChatId ? "none" : "block", md: "block" }}
          position="relative"
          border="1px"
          borderColor="whiteAlpha.200"
          borderTopLeftRadius="xl"
          borderBottomLeftRadius="xl"
        >
          <Flex direction="column" h="100%" maxW="1200px" mx="auto" borderTopLeftRadius="xl">
            {/* Header */}
            <Flex 
              px={6} 
              py={4} 
              borderBottom="1px" 
              borderColor="whiteAlpha.200"
              align="center"
              justify="space-between"
              bg="blackAlpha.300"
              borderTopLeftRadius="xl"
            >
              <Text color="white" fontWeight="medium">Training Assistant</Text>
              {selectedChatId && (
                <Button
                  size="sm"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: "white", bg: "whiteAlpha.200" }}
                  onClick={() => setSelectedChatId(null)}
                  display={{ base: "block", md: "none" }}
                >
                  Ver historial
                </Button>
              )}
            </Flex>

            {/* Chat Messages */}
            <Box 
              flex="1" 
              overflowY="auto" 
              px={{ base: 3, md: 6 }}
              py={6}
              ref={cardBodyRef}
              sx={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'whiteAlpha.200',
                  borderRadius: '24px',
                },
              }}
            >
              <Flex direction="column" gap={6}>
                {messages.map((message, index) => (
                  <Flex
                    key={index}
                    justify={message.role === "human" ? "flex-end" : "flex-start"}
                    gap={3}
                    w="100%"
                  >
                    {message.role === "bot" && (
                      <Circle 
                        size="32px" 
                        bg="blue.500"
                        flexShrink={0}
                      >
                        <IconRobot size={16} color="white" />
                      </Circle>
                    )}
                    <Box
                      maxW={{ base: "85%", md: "70%" }}
                      bg={message.role === "human" ? "blue.500" : "whiteAlpha.200"}
                      color="white"
                      px={4}
                      py={3}
                      borderRadius="2xl"
                      fontSize="sm"
                      boxShadow="sm"
                    >
                      <Text lineHeight="tall">
                        {formatMessageText(message.content)}
                      </Text>
                    </Box>
                    {message.role === "human" && (
                      <Circle 
                        size="32px" 
                        bg="blue.500"
                        flexShrink={0}
                      >
                        <IconUser size={16} color="white" />
                      </Circle>
                    )}
                  </Flex>
                ))}
              </Flex>
              {isLoading && <LoadingMessage />}
            </Box>

            {/* Input Area */}
            <Box 
              py={4}
              px={{ base: 3, md: 6 }}
              borderTop="1px"
              borderColor="whiteAlpha.200"
              bg="blackAlpha.300"
              borderBottomLeftRadius="xl"
            >
              <Flex 
                gap={3} 
                maxW="800px" 
                mx="auto"
                bg="whiteAlpha.100"
                p={2}
                borderRadius="xl"
              >
                <Input
                  value={message}
                  placeholder="Escribe tu consulta..."
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  border="none"
                  color="white"
                  _hover={{ bg: "transparent" }}
                  _focus={{ boxShadow: "none" }}
                  _placeholder={{ color: "whiteAlpha.500" }}
                  size="lg"
                  fontSize="sm"
                />
                <Button
                  colorScheme="blue"
                  px={8}
                  isLoading={isLoading}
                  onClick={handleSendMessage}
                  size="lg"
                  borderRadius="lg"
                  fontSize="sm"
                >
                  Enviar
                </Button>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* Right Side - Chat History */}
        <Box 
          w={{ base: "100%", md: "320px" }} 
          h="100%" 
          borderLeft="1px"
          borderColor="whiteAlpha.200"
          bg="#1A1B1E"
          display={{ base: selectedChatId ? "none" : "block", md: "block" }}
          flexShrink={0}
          borderTopRightRadius="xl"
          borderBottomRightRadius="xl"
        >
          <Flex direction="column" h="100%"
            borderTopRightRadius="xl"
            borderBottomRightRadius="xl"
          >
            <Flex 
              p={4} 
              borderBottom="1px" 
              bg="blackAlpha.300"
              justify="space-between"
              align="center"
              borderTopRightRadius="xl"
              border='1px'
              borderColor="whiteAlpha.200"
            >
              <Text color="white" fontSize="sm" fontWeight="medium">
                Historial de conversaciones
              </Text>
            </Flex>
            <Box 
              flex="1" 
              overflowY="auto" 
              border='1px'
              borderColor="whiteAlpha.200"
              borderBottomRightRadius="xl"
              py={2}
              sx={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'whiteAlpha.200',
                  borderRadius: '24px',
                },
              }}
            >
              <ChatHistoryTraining 
                onSelectChat={handleSelectChat} 
                chatHistoryTraining={chatHistoryTraining} 
                setChatHistoryTraining={setChatHistoryTraining} 
              />
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}

export default Chat;
