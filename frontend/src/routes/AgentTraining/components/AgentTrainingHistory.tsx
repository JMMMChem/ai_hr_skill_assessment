import React, { useEffect, useState } from 'react';
import {
  VStack,
  Text,
  Button,
  useToast
} from "@chakra-ui/react";
import { IconMessage, IconPlus } from "@tabler/icons-react";
import Api from "../../../api";
import AgentTrainingNewChatModal from "./AgentTrainingNewChatModal";
import { CharacterInterface } from "../../../interfaces";
import { useTeam } from "../../../contexts/TeamContext";

interface ChatHistoryTrainingProps {
  onSelectChat: (chatId: number) => void;
  chatHistoryTraining: { id: number; title: string }[];
  setChatHistoryTraining: React.Dispatch<React.SetStateAction<{ id: number; title: string }[]>>;
}

function ChatHistoryTraining({ onSelectChat, chatHistoryTraining, setChatHistoryTraining }: ChatHistoryTrainingProps) {
  const toast = useToast();
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [characters, setCharacters] = useState<CharacterInterface[]>([]);
  const { team } = useTeam();

  useEffect(() => {
    fetchChatHistory();
    fetchCharacters();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const response = await Api.getTrainerConversations();
      setChatHistoryTraining(response);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast({
        title: "Error loading chat history",
        description: "Failed to load chat history. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await Api.getTrainerCharacters();
      if (response) {
        setCharacters(response);
      }
    } catch (error) {
      console.error("Error fetching characters:", error);
      toast({
        title: "Error loading characters",
        description: "Failed to load training characters. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const createChatTraining = async (data: { title: string; characterId: number }) => {
    try {
      if (!team) {
        throw new Error("No team selected");
      }
      const response = await Api.createTrainerConversation(
        data.title, 
        team.id.toString(), 
        data.characterId.toString()
      );
      setChatHistoryTraining(prev => [...prev, { id: response.id, title: data.title }]);
      onSelectChat(response.id);
      setIsNewChatModalOpen(false);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error creating chat",
        description: "Failed to create new chat. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={2} align="stretch" px={2}>
      <Button
        leftIcon={<IconPlus size={16} />}
        variant="ghost"
        color="white"
        _hover={{ bg: "whiteAlpha.200" }}
        size="sm"
        fontSize="sm"
        bg="#2B7FDC"
        onClick={() => setIsNewChatModalOpen(true)}
        mb={2}
      >
        New Chat
      </Button>

      {chatHistoryTraining.length === 0 ? (
        <Text color="whiteAlpha.600" fontSize="sm" textAlign="center" py={4}>
          No hay conversaciones
        </Text>
      ) : (
        chatHistoryTraining.map((chat) => (
          <Button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            variant="ghost"
            justifyContent="flex-start"
            leftIcon={<IconMessage size={16} />}
            color="white"
            _hover={{ bg: "whiteAlpha.200" }}
            size="sm"
            fontSize="sm"
            fontWeight="normal"
            px={3}
            py={6}
            h="auto"
            whiteSpace="normal"
            textAlign="left"
          >
            {chat.title}
          </Button>
        ))
      )}

      <AgentTrainingNewChatModal
        onSave={createChatTraining}
        open={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        characters={characters}
      />
    </VStack>
  );
}

export default ChatHistoryTraining;