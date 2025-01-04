import { useEffect, useState } from "react";
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
  Textarea,
  Text,
} from "@chakra-ui/react";
import { CreateTeam } from "../../../interfaces";

export default function NewTeamModal({ open, onSave, onClose }: { open: boolean, onSave: any, onClose: any }) {

  const [newTeamData, setNewTeamData] = useState<CreateTeam>({ name: '', description: '' });

  useEffect(() => {
    console.log(newTeamData);
    }, [newTeamData]);

  return (
    <>
      <Modal isOpen={open} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Crear un nuevo equipo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
                  <ModalBody pb={6}>
                    <Flex gap={4} direction="column">
                    <Text mb='8px'>Nombre</Text>
                        <Input placeholder='Nombre del asistente'
                            value={newTeamData.name}
                            onChange={(e) => { setNewTeamData({ ...newTeamData, name: e.target.value }) }}
                        />
                        <Text mb='8px'>Descripción</Text>
                        <Textarea placeholder="Descripción"
                            value={newTeamData.description}
                            onChange={(e) => { setNewTeamData({ ...newTeamData, description: e.target.value }) }}

                        />
                    </Flex>
                  </ModalBody>
                  <ModalFooter>
                    <Button colorScheme="teal" variant="solid" mr={3} onClick={() => onSave(newTeamData)}>
                      Crear
                    </Button>
                    <Button onClick={onClose}>Cancelar</Button>
                  </ModalFooter>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}