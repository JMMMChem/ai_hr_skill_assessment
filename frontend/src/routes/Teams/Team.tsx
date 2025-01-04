import { Flex, Table, TableContainer, Thead, Tfoot, Tr, Th } from "@chakra-ui/react";
import {useParams } from "react-router-dom";


export default function Team() {
  const params = useParams();

  const teamId = params["teamId"];


  // const handleShowNotification = () => {
  //   setShowNotification(true);
  //   setTimeout(() => setShowNotification(false), 3000); // Hide notification after 3 seconds
  // };

  return (
    <>
      <Flex justify="space-between" align="center">
        <div>Equipo {teamId}</div>
      </Flex>
      <Flex w="100%" h="100%" p={10}>
        <TableContainer w="100%">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Título</Th>
                <Th>Url</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tfoot>
              <Tr>
                <Th>Título</Th>
                <Th>Fecha</Th>
              </Tr>
            </Tfoot>
          </Table>
        </TableContainer>
      </Flex>
     
      {/* {showNotification && (
        <div style={{ color: "green", fontSize: "1em", marginTop: "10px", textAlign: "center" }}>
          ✔️ Model Trained Successfully
        </div>
      )} */}
    </>
  );
}