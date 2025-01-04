import { defineStyle, defineStyleConfig } from '@chakra-ui/react'

const brandPrimary = defineStyle({
  textDecoration: 'underline',
  color: 'white',
  fontFamily: 'serif',
  fontWeight: 'normal',

  // let's also provide dark mode alternatives
  _dark: {
    color: 'orange.800',
  }
})

export const linkTheme = defineStyleConfig({
  variants: { brandPrimary },
})