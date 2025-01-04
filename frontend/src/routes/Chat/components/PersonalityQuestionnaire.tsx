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
  Textarea,
  Box,
  Progress,
  Heading,
} from "@chakra-ui/react";

interface PersonalityQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
}

interface Question {
  id: string;
  question: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  placeholder?: string;
}

export default function PersonalityQuestionnaire({ isOpen, onClose, onSubmit }: PersonalityQuestionnaireProps) {
  const questions: Question[] = [
    {
      id: 'age',
      question: "How old are you?",
      type: 'number',
      placeholder: 'Enter your age'
    },
    {
      id: 'occupation',
      question: "What's your occupation?",
      type: 'text',
      placeholder: 'Enter your occupation'
    },
    {
      id: 'interests',
      question: "What are your main interests?",
      type: 'textarea',
      placeholder: 'Tell us about your interests...'
    },
    {
      id: 'personality',
      question: "How would you describe your personality?",
      type: 'select',
      options: ['Introvert', 'Extrovert', 'Ambivert']
    },
    {
      id: 'communicationStyle',
      question: "What's your preferred communication style?",
      type: 'select',
      options: ['Direct', 'Diplomatic', 'Casual', 'Formal']
    }
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState<string>('');

  const handleInputChange = (value: string) => {
    setCurrentAnswer(value);
  };

  const handleNext = () => {
    if (currentAnswer.trim() !== '') {
      setAnswers(prev => ({
        ...prev,
        [questions[currentQuestionIndex].id]: currentAnswer
      }));

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      } else {
        const finalAnswers = {
          ...answers,
          [questions[currentQuestionIndex].id]: currentAnswer
        };
        onSubmit(finalAnswers);
        onClose();
      }
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  const renderInput = () => {
    switch (currentQuestion.type) {
      case 'text':
      case 'number':
        return (
          <VStack spacing={4} width="100%">
            <Input
              type={currentQuestion.type}
              placeholder={currentQuestion.placeholder}
              size="lg"
              bg="whiteAlpha.100"
              border="none"
              _focus={{ boxShadow: "none", bg: "whiteAlpha.200" }}
              color="white"
              fontSize="xl"
              height="60px"
              value={currentAnswer}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNext()}
            />
            <Button
              colorScheme="blue"
              size="lg"
              width="100%"
              onClick={handleNext}
              isDisabled={!currentAnswer.trim()}
            >
              Next
            </Button>
          </VStack>
        );
      case 'textarea':
        return (
          <VStack spacing={4} width="100%">
            <Textarea
              placeholder={currentQuestion.placeholder}
              size="lg"
              bg="whiteAlpha.100"
              border="none"
              _focus={{ boxShadow: "none", bg: "whiteAlpha.200" }}
              color="white"
              fontSize="xl"
              value={currentAnswer}
              onChange={(e) => handleInputChange(e.target.value)}
              minH="150px"
            />
            <Button
              colorScheme="blue"
              size="lg"
              width="100%"
              onClick={handleNext}
              isDisabled={!currentAnswer.trim()}
            >
              Next
            </Button>
          </VStack>
        );
      case 'select':
        return (
          <VStack spacing={4} align="stretch" width="100%">
            {currentQuestion.options?.map((option) => (
              <Button
                key={option}
                size="lg"
                variant={currentAnswer === option.toLowerCase() ? "solid" : "outline"}
                colorScheme={currentAnswer === option.toLowerCase() ? "blue" : "whiteAlpha"}
                borderColor="whiteAlpha.400"
                color={currentAnswer === option.toLowerCase() ? "white" : "whiteAlpha.900"}
                _hover={{ bg: "whiteAlpha.200" }}
                height="60px"
                onClick={() => {
                  handleInputChange(option.toLowerCase());
                }}
              >
                {option}
              </Button>
            ))}
            {currentAnswer && (
              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleNext}
                mt={4}
              >
                Next
              </Button>
            )}
          </VStack>
        );
      default:
        return null;
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
        <Progress
          value={progress}
          size="xs"
          colorScheme="blue"
          position="absolute"
          top={0}
          left={0}
          right={0}
          borderTopRadius="md"
        />
        
        <ModalBody>
          <VStack spacing={8} align="stretch" px={8}>
            <Box>
              <Text color="blue.400" mb={2} fontSize="sm">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Text>
              <Heading size="lg" mb={8}>
                {currentQuestion.question}
              </Heading>
            </Box>

            {renderInput()}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

