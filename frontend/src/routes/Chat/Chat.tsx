import { useState, useEffect, useRef } from "react";
import {
  Input,
  Text,
  Box,
  Flex,
  Circle,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { IconSearch, IconSend, IconDotsVertical } from "@tabler/icons-react";
import Api from "../../api";
import { Message, ChatResponse } from "../../interfaces";
import LoadingMessage from "./components/LoadingMessage";

function formatMessageContent(content: string): JSX.Element {
  // Check if this is a final report (contains "comprehensive skill evaluation")
  if (content.includes("comprehensive skill evaluation")) {
    const sections = content.split('\n\n');
    return (
      <Box>
        {sections.map((section, index) => {
          if (section.includes("Score:")) {
            // Format skill sections
            const [skillName, ...rest] = section.split('\n');
            return (
              <Box key={index} mb={4}>
                <Text 
                  color="#0EA5E9" 
                  fontSize="18px" 
                  fontWeight="600" 
                  mb={2}
                >
                  {skillName}
                </Text>
                {rest.map((line, i) => {
                  if (line.startsWith("Score:")) {
                    return (
                      <Text 
                        key={`score-${i}`} 
                        color="#06B6D4" 
                        fontSize="16px" 
                        fontWeight="500"
                        mb={2}
                      >
                        {line}
                      </Text>
                    );
                  }
                  return (
                    <Text 
                      key={`analysis-${i}`} 
                      color="whiteAlpha.800"
                      mb={2}
                    >
                      {line}
                    </Text>
                  );
                })}
              </Box>
            );
          } else if (section.includes("Overall Weighted Score:")) {
            // Format overall score section
            return (
              <Box 
                key={index} 
                mt={6} 
                mb={4} 
                p={4} 
                bg="rgba(14, 165, 233, 0.1)" 
                borderRadius="xl"
              >
                <Text 
                  color="#0EA5E9" 
                  fontSize="20px" 
                  fontWeight="600"
                >
                  {section}
                </Text>
              </Box>
            );
          } else if (section.includes("Key Strengths:") || section.includes("Areas for Development:")) {
            // Format strengths and development areas
            const [title, ...points] = section.split('\n');
            return (
              <Box key={index} mb={4}>
                <Text 
                  color="#0EA5E9" 
                  fontSize="18px" 
                  fontWeight="600" 
                  mb={2}
                >
                  {title}
                </Text>
                {points.map((point, i) => (
                  <Text 
                    key={`point-${i}`} 
                    color="whiteAlpha.800" 
                    ml={4} 
                    mb={1}
                  >
                    {point}
                  </Text>
                ))}
              </Box>
            );
          }
          return (
            <Text key={index} mb={4} color="whiteAlpha.900">
              {section}
            </Text>
          );
        })}
      </Box>
    );
  }

  // For regular messages, just return the text
  return <Text>{content}</Text>;
}

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const cardBodyRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const initRef = useRef(false);

  // Create conversation and start assessment
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Skip if already initialized
        if (initRef.current) return;
        initRef.current = true;

        // Create a new conversation first
        const teamId = localStorage.getItem('team_id');
        if (!teamId) {
          console.error("No team ID found");
          return;
        }

        const conversation = await Api.createConversation("Skill Assessment", teamId, "1");
        setConversationId(conversation.id);

        // Then start the assessment
        await sendTextToChatBot("Hello, I'm ready to start the skill assessment.", conversation.id);
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initializeChat();
  }, []);

  async function sendTextToChatBot(text: string, chatId?: number) {
    setIsLoading(true);

    const userMessage: Message = { content: text, role: "human" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    try {
      // Use provided chatId or fall back to stored conversationId
      const currentChatId = chatId || conversationId;
      if (!currentChatId) {
        throw new Error("No conversation ID available");
      }

      const data: ChatResponse = await Api.sendTextToChatBot(text, currentChatId);
      const botMessage: Message = { content: data.completion, role: "bot" };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error sending message to chatbot", error);
      const errorMessage: Message = { content: "Error processing your request", role: "bot" };
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

  return (
    <Box w="100%" h="100%" bgGradient="linear(to-b, #0F1117, #1A1D27)" borderRadius="3xl" overflow="hidden">
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
                    {formatMessageContent(message.content)}
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
                placeholder="Type your message..."
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
    </Box>
  );
}

export default Chat;