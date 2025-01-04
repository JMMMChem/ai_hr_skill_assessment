import React, { useState, FormEvent, useEffect } from 'react';
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  Link,
} from '@chakra-ui/react';
import Api from '../../api';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { getTeamId } from '../../utils';
import SignupModal from '../Chat/components/SignupModal';

interface LoginResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
}

export default function Login(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const toast = useToast();
  const {user, setUser} = useUser();
  const {setTeam} = useTeam();

  useEffect(() => {
    if (user != null) {
        navigate("/")
    }}, [user])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: LoginResponse = await Api.login(email, password);
      
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
        status: "success",
        duration: 9000,
        isClosable: true,
      });

      if (rememberMe) {
        localStorage.setItem('token', response.access_token);
      } else {
        sessionStorage.setItem('token', response.access_token);
      }
      
      const fetchedUser = await Api.getCurrentUser();
        setUser(fetchedUser);
        if (fetchedUser && fetchedUser.teams.length > 0) {
          const teamId = getTeamId();
          const selectedTeam = teamId
            ? fetchedUser.teams.find(t => t.id === teamId)
            : fetchedUser.teams[0];
          setTeam(selectedTeam || null);
        } else {
          setTeam(null);
        }
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Contraseña incorrecta",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSuccess = async () => {
    // After successful signup, try to log in automatically
    try {
      const response: LoginResponse = await Api.login(email, password);
      if (rememberMe) {
        localStorage.setItem('token', response.access_token);
      } else {
        sessionStorage.setItem('token', response.access_token);
      }
      
      const fetchedUser = await Api.getCurrentUser();
      setUser(fetchedUser);
      if (fetchedUser && fetchedUser.teams.length > 0) {
        const teamId = getTeamId();
        const selectedTeam = teamId
          ? fetchedUser.teams.find(t => t.id === teamId)
          : fetchedUser.teams[0];
        setTeam(selectedTeam || null);
      } else {
        setTeam(null);
      }
      navigate('/');
    } catch (error) {
      // Remove the error toast since it's not needed for signup
      setIsSignupModalOpen(false);
    }
  };

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={"blackAlpha.700"}>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'} color={'white'}>Inicia sesión en tu cuenta</Heading>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl id="email">
                <FormLabel>Email</FormLabel>
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
              </FormControl>
              <FormControl id="password">
                <FormLabel>Contraseña</FormLabel>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </FormControl>
              <Stack spacing={10}>
                <Stack
                  direction={{ base: 'column', sm: 'row' }}
                  align={'start'}
                  justify={'space-between'}>
                  <Checkbox 
                    isChecked={rememberMe}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                  >
                    Recuérdame
                  </Checkbox>
                  <Text color={'blue.400'}>¿Has olvidado tu contraseña?</Text>
                </Stack>
                <Stack spacing={3}>
                  <Text fontSize={'md'} textAlign={'center'}>
                    ¿No tienes una cuenta?{' '}
                    <Link color={'blue.400'} onClick={() => setIsSignupModalOpen(true)}>
                      Regístrate
                    </Link>
                  </Text>
                  <Button
                    type="submit"
                    bg={'teal'}
                    color={'white'}
                    isLoading={isLoading}
                  >
                    Iniciar sesión
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Stack>

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSignupSuccess={handleSignupSuccess}
      />
    </Flex>
  );
}