import { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  Text,
  VStack,
  Input,
  Box,
  Heading,
} from "@chakra-ui/react";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

export default function EmailModal({ isOpen, onClose, onSubmit }: EmailModalProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (email.trim()) {
      onSubmit(email.trim());
      setEmail("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent
        bg="gray.900"
        color="white"
        py={8}
        mx={4}
      >
        <ModalBody>
          <VStack spacing={8} align="stretch" px={8}>
            <Box>
              <Text color="blue.400" mb={2} fontSize="sm">
                Let's get started
              </Text>
              <Heading size="lg" mb={8}>
                What's your email address?
              </Heading>
            </Box>

            <VStack spacing={4} width="100%">
              <Input
                type="email"
                placeholder="your@email.com"
                size="lg"
                bg="whiteAlpha.100"
                border="none"
                _focus={{ boxShadow: "none", bg: "whiteAlpha.200" }}
                color="white"
                fontSize="xl"
                height="60px"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <Button
                colorScheme="blue"
                size="lg"
                width="100%"
                onClick={handleSubmit}
                isDisabled={!email.trim() || !email.includes('@')}
              >
                Continue
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
