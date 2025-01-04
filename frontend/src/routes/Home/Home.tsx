'use client'

import {
  Box,
  Heading,
  Container,
  Text,
  Button,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import Sections from './Sections'

export default function Home() {
  const navigate = useNavigate()

  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius="3xl"
      bg={useColorModeValue('gray.800', 'gray.900')}
      boxShadow="2xl"
    >
      <Container maxW={'4xl'}>
        <Stack
          as={Box}
          textAlign={'center'}
          spacing={{ base: 10, md: 16 }}
          py={{ base: 24, md: 40 }}>
          <Stack spacing={6}>
            <Heading
              color="white"
              fontWeight={700}
              fontSize={{ base: '3xl', sm: '4xl', md: '6xl' }}
              lineHeight={'110%'}
              letterSpacing="tight"
            >
              Crea tus propios{' '}
              <Text
                as={'span'}
                bgGradient="linear(to-r, teal.400, blue.500)"
                bgClip="text"
              >
                asistentes inteligentes
              </Text>
            </Heading>
            <Text
              color={'gray.400'}
              fontSize={{ base: 'lg', md: 'xl' }}
              maxW={'3xl'}
              mx="auto"
            >
              Sube documentos y otros archivos para crear tu propio asistente. 
              Interactúa con él y obtén respuestas precisas a tus preguntas.
            </Text>
            <Text
              color={'gray.400'}
              fontSize={{ base: 'md', md: 'lg' }}
            >
              Y mejora tus habilidades negociadoras con nuestro entrenador de agentes.
            </Text>
          </Stack>

          <Stack
            direction={'column'}
            spacing={6}
            align={'center'}
            alignSelf={'center'}
            position={'relative'}
          >
            <Button
              colorScheme={'teal'}
              bg={'teal.400'}
              rounded={'full'}
              px={8}
              py={7}
              fontSize={'lg'}
              _hover={{
                bg: 'teal.500',
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              transition="all 0.2s"
              onClick={() => navigate('/dashboard/chat')}
            >
              Comenzar ahora
            </Button>
          </Stack>

          <Box>
            <Sections />
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}