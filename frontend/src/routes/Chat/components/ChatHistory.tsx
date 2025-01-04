import { useState, useEffect } from 'react';
import { Box, Flex, Circle, Text, VStack } from "@chakra-ui/react";
import { IconMessage } from "@tabler/icons-react";
import NewChatModal from "./NewChatModal";
import Api from "../../../api";
import { getAccessToken } from "../../../utils";

interface ChatHistoryProps {
  onSelectChat: (chatId: number) => void;
  chatHistory: { id: number; title: string }[];
  setChatHistory: React.Dispatch<React.SetStateAction<{ id: number; title: string }[]>>;
}

export default function ChatHistory({ onSelectChat, chatHistory, setChatHistory }: ChatHistoryProps) {
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const teamId = localStorage.getItem('team_id');
        if (!teamId) {
          console.error("No team ID found in localStorage");
          return;
        }
        console.log("Loading chats for team:", teamId);
        const response = await Api.getConversations();
        console.log("Loaded chats:", response);
        setChatHistory(response || []);
      } catch (error) {
        console.error("Error loading chats:", error);
      }
    };

    loadChats();
  }, []);


  async function createChat(data: { title: string; assistantId: number }) {
    try {
      const teamId = localStorage.getItem('team_id');
      if (!teamId) {
        throw new Error("No team ID found. Please log in again.");
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error("No access token found. Please log in again.");
      }

      const response = await Api.createConversation(data.title, teamId, "1");
      
      if (!response || !response.id) {
        throw new Error("Failed to create chat. Invalid response from server.");
      }

      setChatHistory((prevChatHistory) => [...prevChatHistory, { id: response.id, title: data.title }]);
      setSelectedChatId(response.id);
      onSelectChat(response.id);
      setIsNewChatModalOpen(false);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  }

  const handleChatSelect = (chatId: number) => {
    setSelectedChatId(chatId);
    onSelectChat(chatId);
  };

  return (
    <VStack spacing={0} align="stretch">
      <Box
        py={3}
        px={3}
        cursor="pointer"
        onClick={() => setIsNewChatModalOpen(true)}
        _hover={{ bg: '#0D1219' }}
        transition="all 0.2s"
      >
        <Flex align="center" gap={2}>
          <Circle 
            size="32px" 
            bg="#151C27"
            color="whiteAlpha.600"
          >
            <IconMessage size={14} />
          </Circle>
          <Text 
            color="whiteAlpha.900" 
            fontSize="16px" 
            fontWeight="600"
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display'"
            letterSpacing="-0.02em"
          >
            New Chat
          </Text>
        </Flex>
      </Box>

      {chatHistory.map((chat) => (
        <Box
          key={chat.id}
          py={2}
          px={3}
          cursor="pointer"
          bg={selectedChatId === chat.id ? '#0D1219' : 'transparent'}
          _hover={{ bg: '#0D1219' }}
          onClick={() => handleChatSelect(chat.id)}
          position="relative"
          role="group"
          transition="all 0.2s"
        >
          <Flex align="center" gap={2}>
            <Circle 
              size="32px" 
              bg={selectedChatId === chat.id ? "#0EA5E9" : "#151C27"}
              color={selectedChatId === chat.id ? "white" : "whiteAlpha.600"}
            >
              <IconMessage size={14} />
            </Circle>
            <Box flex="1" minW={0}>
              <Text 
                color={selectedChatId === chat.id ? "white" : "whiteAlpha.900"} 
                fontSize="16px" 
                fontWeight="600"
                noOfLines={1}
                fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display'"
                letterSpacing="-0.02em"
              >
                {chat.title}
              </Text>
              <Text 
                color="whiteAlpha.600" 
                fontSize="15px" 
                noOfLines={1}
                fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display'"
                letterSpacing="-0.02em"
                fontWeight="500"
              >
                Último mensaje...
              </Text>
            </Box>
            <Text 
              color="whiteAlpha.500" 
              fontSize="14px"
              fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display'"
              letterSpacing="-0.02em"
              fontWeight="500"
            >
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Flex>
        </Box>
      ))}

      <NewChatModal
        onSave={createChat}
        open={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />
    </VStack>
  );
}