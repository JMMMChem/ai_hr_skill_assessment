'use client'

import { ReactElement } from 'react'
import { Box, SimpleGrid, Icon, Text, Stack, Flex } from '@chakra-ui/react'
import { IconBook, IconMessage, IconRobot } from '@tabler/icons-react'

interface FeatureProps {
  title: string
  text: string
  icon: ReactElement
}

const Feature = ({ title, text, icon }: FeatureProps) => {
  return (
    <Stack
      align={'center'}
      justify={'center'}
      p={6}
      bg="whiteAlpha.50"
      borderRadius="2xl"
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-5px)',
        bg: 'whiteAlpha.100',
      }}
    >
      <Flex
        w={20}
        h={20}
        align={'center'}
        justify={'center'}
        color={'white'}
        rounded={'2xl'}
        bg={'whiteAlpha.100'}
        backdropFilter="blur(10px)"
        mb={4}
        boxShadow="lg"
      >
        {icon}
      </Flex>
      <Text
        fontWeight={600}
        fontSize={'xl'}
        mb={2}
        color="white"
      >
        {title}
      </Text>
      <Text
        color={'gray.400'}
        fontSize={'md'}
        textAlign="center"
      >
        {text}
      </Text>
    </Stack>
  )
}

export default function Sections() {
  return (
    <Box p={8}>
      <SimpleGrid
        columns={{ base: 1, md: 3 }}
        spacing={10}
        mx="auto"
        maxW="4xl"
      >
        <Feature
          icon={<Icon as={IconRobot} color={'teal.400'} w={10} h={10} />}
          title={'Crea el asistente'}
          text={'Personaliza tu asistente virtual con un nombre único y configura sus capacidades.'}
        />
        <Feature
          icon={<Icon as={IconBook} color={'teal.400'} w={10} h={10} />}
          title={'Entrénalo'}
          text={'Alimenta tu asistente con documentos y conocimientos específicos para tu negocio.'}
        />
        <Feature
          icon={<Icon as={IconMessage} color={'teal.400'} w={10} h={10} />}
          title={'Interactúa'}
          text={'Mantén conversaciones naturales y obtén respuestas precisas al instante.'}
        />
      </SimpleGrid>
    </Box>
  )
}