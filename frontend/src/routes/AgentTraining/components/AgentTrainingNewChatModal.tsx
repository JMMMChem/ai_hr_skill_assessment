import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
} from "@chakra-ui/react";
import { useState } from "react";
import { CharacterInterface } from "../../../interfaces";

interface AgentTrainingNewChatModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; characterId: number }) => void;
  characters: CharacterInterface[];
}

function AgentTrainingNewChatModal({ open, onClose, onSave, characters }: AgentTrainingNewChatModalProps) {
  const [title, setTitle] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<number>(
    characters.length > 0 ? characters[0].id : 0
  );

  const handleSave = () => {
    if (title.trim() && selectedCharacter > 0) {
      onSave({
        title: title.trim(),
        characterId: selectedCharacter,
      });
      setTitle("");
      onClose();
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>Nuevo Chat de Entrenamiento</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Título</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ingrese un título para el chat"
              bg="whiteAlpha.100"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _hover={{ borderColor: "whiteAlpha.400" }}
              _focus={{ borderColor: "blue.300", boxShadow: "none" }}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Personaje</FormLabel>
            <Select
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(Number(e.target.value))}
              bg="whiteAlpha.100"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _hover={{ borderColor: "whiteAlpha.400" }}
              _focus={{ borderColor: "blue.300", boxShadow: "none" }}
              placeholder="Seleccionar personaje"
            >
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </Select>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={handleSave} isDisabled={!title.trim() || selectedCharacter === 0}>
            Crear
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AgentTrainingNewChatModal;