import { Box, Flex, Circle, keyframes, Spinner, Text } from "@chakra-ui/react";

const pulseKeyframes = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 0.7; }
  100% { opacity: 0.4; }
`;

const pulseAnimation = `${pulseKeyframes} 2s ease-in-out infinite`;

export default function LoadingMessage() {
  return (
    <Flex gap={3} align="flex-start" w="100%">
      <Circle 
        size="36px"
        bgGradient="linear(to-r, #3B82F6, #2563EB)"
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
          bgGradient="linear(to-r, #3B82F6, #2563EB)"
          filter="blur(8px)"
          opacity="0.5"
          borderRadius="full"
        />
        <Text fontSize="lg" position="relative" zIndex={1}>👨‍💼</Text>
      </Circle>
      <Box
        maxW={{ base: "85%", md: "65%" }}
        bg="rgba(59, 130, 246, 0.1)"
        px={4}
        py={3}
        borderRadius="2xl"
        minH="40px"
        animation={pulseAnimation}
        display="flex"
        alignItems="center"
        gap={3}
      >
        <Spinner 
          size="sm" 
          color="#3B82F6" 
          speed="0.8s"
          emptyColor="rgba(59, 130, 246, 0.1)"
        />
        <Box 
          w="40%" 
          h="2px" 
          bgGradient="linear(to-r, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1))" 
          borderRadius="full" 
        />
      </Box>
    </Flex>
  );
}
