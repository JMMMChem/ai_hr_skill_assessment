import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Text,
  useDisclosure,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  VStack,
  Avatar,
} from "@chakra-ui/react";

import { Outlet, useLocation, Link } from "react-router-dom";
import {
  IconHome,
  IconLogout,
  IconMessage,
  IconMenu2,
  IconUser,
} from "@tabler/icons-react";
import { useUser } from "../contexts/AuthContext";

function Navigation({ onClose = () => {} }) {
  const { pathname } = useLocation();
  const { user } = useUser();

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
  }

  const links = [
    {
      label: "Principal",
      links: [
        { link: "/dashboard/chat", icon: IconMessage, label: "Chat", active: pathname === "/dashboard/chat" },
      ],
    },
  ];

  return (
    <Flex
      direction="column"
      w="100%"
      h="100%"
      justify="space-between"
      py={5}
    >
      <Flex px={5} mb={4} align="center" gap={3}>
        <Avatar size="sm" icon={<IconUser />} />
        <VStack align="start" spacing={0}>
          <Text color="white" fontWeight="bold">{user?.email}</Text>
          <Text color="whiteAlpha.700" fontSize="sm">Activo</Text>
        </VStack>
      </Flex>
      
      <VStack spacing={8} align="stretch" flex={1}>
        {links.map((section, idx) => (
          <Box key={idx}>
            <Text as="b" color="white" px={5} mb={4} display="block">
              {section.label}
            </Text>
            <VStack spacing={2} align="stretch">
              {section.links.map((path) => (
                <Link
                  onClick={onClose}
                  to={path.link}
                  key={path.link}
                >
                  <Flex
                    px={5}
                    py={3}
                    gap={3}
                    align="center"
                    bg={path.active ? "whiteAlpha.100" : "transparent"}
                    _hover={{ bg: "whiteAlpha.200" }}
                    borderRadius="md"
                    transition="all 0.2s"
                  >
                    <Box
                      as={path.icon}
                      color={path.active ? "teal.300" : "white"}
                    />
                    <Text
                      color={path.active ? "teal.300" : "white"}
                      fontWeight={path.active ? "bold" : "normal"}
                    >
                      {path.label}
                    </Text>
                  </Flex>
                </Link>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>

      <Box px={5} mt={8}>
        <Button
          leftIcon={<IconLogout />}
          colorScheme="teal"
          variant="solid"
          onClick={logout}
          w="100%"
        >
          Logout
        </Button>
      </Box>
    </Flex>
  );
}

export default function AppLayout() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  return (
    <Box 
      h="100vh" 
      bg="blackAlpha.700" 
      overflow="hidden" 
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
    >
      {isMobile && (
        <Flex 
          position="fixed" 
          top={0} 
          h="60px"
          left={0} 
          right={0} 
          zIndex={2} 
          align="center"
          px={4}
          bg="blackAlpha.700"
        >
          <IconButton
            aria-label="Open menu"
            icon={<IconMenu2 color="white" />}
            onClick={onOpen}
            variant="ghost"
            colorScheme="whiteAlpha"
            _hover={{ bg: 'whiteAlpha.200' }}
          />
        </Flex>
      )}

      <Grid
        h="100%"
        w="100%"
        templateAreas={isMobile ? `"main"` : `"nav main"`}
        gridTemplateRows="1fr"
        gridTemplateColumns={isMobile ? "1fr" : "250px 1fr"}
        pt={isMobile ? "60px" : 0}
        overflow="hidden"
      >
        {isMobile ? (
          <Drawer 
            isOpen={isOpen} 
            placement="left" 
            onClose={onClose}
            size="xs"
          >
            <DrawerOverlay />
            <DrawerContent bg="blackAlpha.700">
              <DrawerCloseButton color="white" />
              <DrawerHeader color="white">Menu</DrawerHeader>
              <DrawerBody>
                <Navigation onClose={onClose} />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        ) : (
          <GridItem pl="2" area="nav" overflow="hidden">
            <Navigation />
          </GridItem>
        )}

        <GridItem area="main" p={{ base: 4, md: 6 }} overflow="hidden">
          <Flex
            direction="column"
            bg="gray.800"
            borderRadius="xl"
            w="full"
            maxW={{ base: "90%", sm: "95%", md: "95%", lg: "95%" }}
            mx="auto"
            h={{ base: "calc(100vh - 160px)", md: "calc(100vh - 100px)" }}
            p={{ base: 3, md: 5 }}
            overflow="auto"
          >
            <Outlet />
          </Flex>
        </GridItem>
      </Grid>
    </Box>
  );
}
