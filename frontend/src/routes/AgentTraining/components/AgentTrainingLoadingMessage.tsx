import { Box, Circle, Flex } from "@chakra-ui/react";
import { IconRobot } from "@tabler/icons-react";
import { BeatLoader } from "react-spinners";

export default function LoadingMessage() {
  return (
    <Flex
        justify={ "start"}
        mb={5}
    >
      <Circle size="48px" bg="teal.500" color="white" zIndex={1} m={2}>
        <IconRobot />
      </Circle>
      <Box
        w={"60%"}
        bg={"gray.100"}
        p={5}
        borderTopRightRadius={0}
        borderBottomLeftRadius={0}
        borderTopLeftRadius={15}
        borderBottomRightRadius={15}
      >
        <Flex justify={"start"} align={"center"} w={"100%"} h={"100%"}>
        <BeatLoader 
            color={"#2c3e50"}
            loading={true}
            size={10}
            margin={2}
        />
        </Flex>
      </Box>
    </Flex>
  );
}
