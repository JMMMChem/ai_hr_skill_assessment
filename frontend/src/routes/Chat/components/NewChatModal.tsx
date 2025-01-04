import { useState } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Flex,
  Input,
  Text,
  // Select,
} from "@chakra-ui/react";
import { CreateChat } from "../../../interfaces";

interface NewChatModalProps {
  open: boolean;
  onSave: (data: CreateChat) => void;
  onClose: () => void;
}

export default function NewChatModal({ open, onSave, onClose }: NewChatModalProps) {
  const [newChatData, setNewChatData] = useState<CreateChat>({ title: '', assistantId: 0 });

  const handleSave = () => {
    if (!newChatData.title.trim()) return;
    onSave(newChatData);
    setNewChatData({ title: '', assistantId: 1 });
  };

  return (
    <Modal isOpen={open} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>Create a new chat</ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody pb={6}>
          <Flex gap={4} direction="column">
            <Text fontSize="sm" color="gray.300">Título</Text>
            <Input 
              placeholder='Título de la conversación'
              value={newChatData.title}
              onChange={(e) => setNewChatData({ ...newChatData, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newChatData.title.trim()) {
                  handleSave();
                }
              }}
              bg="whiteAlpha.100"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _hover={{ borderColor: "whiteAlpha.400" }}
              _focus={{ bg: "whiteAlpha.200", borderColor: "blue.400" }}
              color="white"
              _placeholder={{ color: "whiteAlpha.500" }}
              autoFocus
            />
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            onClick={handleSave}
            isDisabled={!newChatData.title.trim()}
          >
            Crear
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            _hover={{ bg: "whiteAlpha.200" }}
          >
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}