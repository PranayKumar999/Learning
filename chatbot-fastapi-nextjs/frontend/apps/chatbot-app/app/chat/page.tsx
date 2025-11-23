'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Text,
  Flex,
  IconButton,
  Spacer,
} from '@chakra-ui/react';
import { LuSend, LuUser, LuBot } from 'react-icons/lu';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! How can I help you today?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    // Add empty assistant message that will be filled by streaming
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
    };
    setMessages([...newMessages, assistantMessage]);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call the POST chat endpoint with only the latest message
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [userMessage], // Only send the latest message to reduce costs
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setIsLoading(false);
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });

          // The response is in AI SDK format like: 0:"content"\n
          // Extract the content from the format
          const matches = chunk.match(/0:"([^"]*)"/g);
          if (matches) {
            matches.forEach((match) => {
              // Extract content from format: 0:"content"
              // match.slice(3, -1) removes '0:"' from start and '"' from end
              // replace(/\\"/g, '"') converts escaped quotes back to normal quotes
              const content = match.slice(3, -1).replace(/\\"/g, '"');
              accumulatedContent += content;

              // Update the last message (assistant's message) with accumulated content
              setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1] = {
                  role: 'assistant',
                  content: accumulatedContent,
                };
                return updatedMessages;
              });
            });
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);

      // Update the last message with error
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const errorMessage =
          error instanceof Error &&
          error.message === 'No authentication token found'
            ? 'Please log in to continue chatting.'
            : 'Sorry, I encountered an error. Please try again.';

        updatedMessages[updatedMessages.length - 1] = {
          role: 'assistant',
          content: errorMessage,
        };
        return updatedMessages;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxW="container.xl" h="100vh" p={0}>
      <Flex direction="column" h="100%">
        {/* Header */}
        <Box
          bg="bg.subtle"
          borderBottomWidth="1px"
          borderColor="border"
          px={6}
          py={4}
        >
          <HStack>
            <Text fontSize="xl" fontWeight="semibold">
              Chat Assistant
            </Text>
            <Spacer />
            <Text fontSize="sm" color="fg.muted">
              Online
            </Text>
          </HStack>
        </Box>

        {/* Messages Area */}
        <Box flex="1" overflowY="auto" bg="bg" p={4}>
          <VStack gap={4} align="stretch">
            {messages.map((message, index) => (
              <Flex
                key={index}
                justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
              >
                <HStack
                  maxW="70%"
                  align="flex-start"
                  gap={2}
                  flexDirection={
                    message.role === 'user' ? 'row-reverse' : 'row'
                  }
                >
                  <Box
                    w={8}
                    h={8}
                    borderRadius="full"
                    bg={message.role === 'user' ? 'blue.500' : 'gray.500'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    {message.role === 'user' ? (
                      <LuUser size={16} color="white" />
                    ) : (
                      <LuBot size={16} color="white" />
                    )}
                  </Box>
                  <Box
                    bg={message.role === 'user' ? 'blue.50' : 'gray.50'}
                    _dark={{
                      bg: message.role === 'user' ? 'blue.900' : 'gray.800',
                    }}
                    px={4}
                    py={2}
                    borderRadius="lg"
                    borderTopRightRadius={
                      message.role === 'user' ? '4px' : 'lg'
                    }
                    borderTopLeftRadius={
                      message.role === 'assistant' ? '4px' : 'lg'
                    }
                  >
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {message.content}
                    </Text>
                    <Text fontSize="xs" color="fg.muted" mt={1}>
                      {formatTime(new Date())}
                    </Text>
                  </Box>
                </HStack>
              </Flex>
            ))}
            {isLoading && (
              <Flex justify="flex-start">
                <HStack maxW="70%" align="flex-start" gap={2}>
                  <Box
                    w={8}
                    h={8}
                    borderRadius="full"
                    bg="gray.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <LuBot size={16} color="white" />
                  </Box>
                  <Box
                    bg="gray.50"
                    _dark={{ bg: 'gray.800' }}
                    px={4}
                    py={2}
                    borderRadius="lg"
                    borderTopLeftRadius="4px"
                  >
                    <HStack gap={1}>
                      <Box
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg="gray.400"
                        animation="pulse 1.4s infinite"
                      />
                      <Box
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg="gray.400"
                        animation="pulse 1.4s infinite"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <Box
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg="gray.400"
                        animation="pulse 1.4s infinite"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </HStack>
                  </Box>
                </HStack>
              </Flex>
            )}
            <div ref={messagesEndRef} />
          </VStack>
        </Box>

        {/* Input Area */}
        <Box borderTopWidth="1px" borderColor="border" bg="bg.subtle" p={4}>
          <HStack gap={2}>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              size="lg"
              bg="bg"
              borderRadius="full"
              px={4}
              disabled={isLoading}
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
              }}
            />
            <IconButton
              aria-label="Send message"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="lg"
              borderRadius="full"
              colorScheme="blue"
            >
              <LuSend />
            </IconButton>
          </HStack>
        </Box>
      </Flex>
    </Container>
  );
}
