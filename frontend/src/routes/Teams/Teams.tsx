import { Box, Flex, Text, Button, Grid, GridItem } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import Api from "../../api";
import { useEffect, useState } from "react";
import NewTeamModal from "./components/NewTeamModal";
import { TeamInterface } from "../../interfaces";

export default function Teams() {
  const [teams, setTeams] = useState<TeamInterface[]>([]);
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const response = await Api.getTeams();
      if (response) {
        setTeams(response);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  }

  async function createTeam(newTeam: TeamInterface) {
    try {
      const response = await Api.createTeam(newTeam.name, newTeam.description);
      if (response) {
        setTeams([...teams, response]);
        setIsNewTeamModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating team:", error);
    }
  }

  return (
    <Box w="100%" h="100%" p={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="3xl" fontWeight="bold">
          Equipos
        </Text>
        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={() => setIsNewTeamModalOpen(true)}>
          Añadir nuevo equipo
        </Button>
      </Flex>
      
      <NewTeamModal onSave={createTeam} open={isNewTeamModalOpen} onClose={() => setIsNewTeamModalOpen(false)} />
      
      <Flex flexWrap="wrap" justifyContent="justify-content" w="100%">
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
          {teams.map((team) => (
            <GridItem key={team.id}>
              <Box
                p={5}
                borderWidth="1px"
                borderRadius="lg"
                _hover={{ backgroundColor: "gray.100", transform: "scale(1.05)", transition: "all 0.2s" }}
                cursor="pointer"
                textAlign="center"
                onClick={() => window.location.href = `teams/${team.id}`}
              >
                <Text fontWeight="bold" fontSize="lg">{team.name}</Text>
              </Box>
            </GridItem>
          ))}
        </Grid>
      </Flex>
    </Box>
  );
}