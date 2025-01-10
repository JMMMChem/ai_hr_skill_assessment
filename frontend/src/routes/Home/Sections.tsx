'use client'

import { ReactElement } from 'react'
import { Box, SimpleGrid, Icon, Text, Stack, Flex } from '@chakra-ui/react'
import { IconBrain, IconChartBar, IconBulb } from '@tabler/icons-react'

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
          icon={<Icon as={IconBrain} color={'teal.400'} w={10} h={10} />}
          title={'AI Assessment'}
          text={'Advanced evaluation of your soft skills using state-of-the-art AI technology'}
        />
        <Feature
          icon={<Icon as={IconChartBar} color={'teal.400'} w={10} h={10} />}
          title={'Detailed Analysis'}
          text={'Get comprehensive insights across six key ML Engineering competencies'}
        />
        <Feature
          icon={<Icon as={IconBulb} color={'teal.400'} w={10} h={10} />}
          title={'Growth Insights'}
          text={'Receive actionable recommendations to enhance your professional skills'}
        />
      </SimpleGrid>
    </Box>
  )
}