'use client';

import React, { useState } from 'react';
import {
  Box,
  Input,
  Button,
  Heading,
  Stack,
  Flex,
  Text,
  Icon,
  Field,
  Fieldset,
  Card,
  Center,
} from '@chakra-ui/react';
import { Icons } from './components/icons';
import { api } from './lib/util';
import { useRouter } from 'next/navigation';

const Layout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const response = await api.post('/login', {
      username,
      password,
    });

    if (response.error) {
      console.error('Login failed:', response.error);
    } else {
      console.log('Login successful:', response.data);
      sessionStorage.setItem('token', response.data.access_token);
      router.push('/chat');
    }

    setIsLoading(false);
  };

  const handleRegister = () => {
    console.log('Registering user');
  };

  const handleForgotPassword = () => {
    console.log('Forgot password');
  };

  return (
    <Center
      minH="100vh"
      bgGradient="to-br"
      gradientFrom="purple.600"
      gradientTo="pink.600"
    >
      <Card.Root maxW="md" w="full" mx={4}>
        <Card.Body p={8}>
          <Stack gap={4} align="center" mb={8}>
            <Center
              w={20}
              h={20}
              bgGradient="to-br"
              gradientFrom="purple.600"
              gradientTo="pink.600"
              rounded="full"
            >
              <Icon color="white" boxSize={10}>
                <Icons.User />
              </Icon>
            </Center>
            <Heading
              fontSize="3xl"
              bgGradient="to-r"
              gradientFrom="purple.500"
              gradientTo="pink.500"
              bgClip="text"
              fontWeight="bold"
            >
              Welcome to Chatbot
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Sign in to continue to your account
            </Text>
          </Stack>

          <form onSubmit={handleSubmit} id="loginForm">
            <Fieldset.Root disabled={isLoading}>
              <Fieldset.Content>
                <Stack gap={6}>
                  <Field.Root required>
                    <Box position="relative" width={'full'}>
                      <Icon
                        position="absolute"
                        left={4}
                        top="50%"
                        transform="translateY(-50%)"
                        color="gray.400"
                        zIndex={1}
                      >
                        <Icons.NormalUser />
                      </Icon>
                      <Input
                        name="username"
                        placeholder="Username or Email"
                        pl={12}
                        size="lg"
                        variant="subtle"
                        required
                        minLength={3}
                      />
                    </Box>
                  </Field.Root>

                  <Field.Root required>
                    <Box position="relative" width={'full'}>
                      <Icon
                        position="absolute"
                        left={4}
                        top="50%"
                        transform="translateY(-50%)"
                        color="gray.400"
                        zIndex={1}
                      >
                        <Icons.Lock />
                      </Icon>
                      <Input
                        name="password"
                        placeholder="Password"
                        type="password"
                        pl={12}
                        size="lg"
                        variant="subtle"
                        required
                        minLength={6}
                      />
                    </Box>
                  </Field.Root>

                  <Button
                    type="submit"
                    size="lg"
                    colorPalette="purple"
                    variant="solid"
                    loading={isLoading}
                    loadingText="Signing in..."
                    w="full"
                  >
                    <Icon mr={2}>
                      <Icons.ChevronRight />
                    </Icon>
                    Sign In
                  </Button>

                  <Flex justify="space-between" align="center" pt={2}>
                    <Button
                      variant="ghost"
                      size="sm"
                      colorPalette="purple"
                      onClick={handleForgotPassword}
                      fontWeight="normal"
                    >
                      Forgot Password?
                    </Button>
                  </Flex>

                  <Box textAlign="center" pt={4}>
                    <Text color="gray.600" fontSize="sm">
                      Don't have an account?{' '}
                      <Button
                        variant="plain"
                        colorPalette="purple"
                        fontWeight="semibold"
                        onClick={handleRegister}
                      >
                        Sign up now
                      </Button>
                    </Text>
                  </Box>
                </Stack>
              </Fieldset.Content>
            </Fieldset.Root>
          </form>
        </Card.Body>
      </Card.Root>
    </Center>
  );
};

export default Layout;
