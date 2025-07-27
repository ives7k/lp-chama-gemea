import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { Star, Moon, Heart, Eye, Paintbrush as PaintBrush, Check, Lock, Plus, X, Send, MessageCircle } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCcVisa, faCcMastercard, faCcAmex, faPix } from '@fortawesome/free-brands-svg-icons';
import { useScrollAnimation } from './hooks/useScrollAnimation';

// Lazy load components
const Stars = lazy(() => import('./components/Stars'));

type Message = {
  type: 'user' | 'bot';
  text: string;
  isTyping?: boolean;
};

function App() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  useScrollAnimation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 15000); // 15 seconds delay

    return () => clearTimeout(timer);
  }, []);

  // New function to scroll chat to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Effect to scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const sendMessageToWebhook = async (messageText: string) => {
    try {
      const response = await fetch('https://n8n.mwbpdo.easypanel.host/webhook/37fee2b8-456f-414c-8ffe-5c64b4a11b68', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          sessionId: sessionIdRef.current,
          section: window.location.hash || 'main' // Identifies which section the chat is from
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Error sending message:', error);
      return [{ output: "Desculpe, estou com dificuldade para me conectar ao servidor. Por favor, tente novamente em alguns instantes." }];
    }
  };

  const addMessageWithDelay = async (message: string, type: 'user' | 'bot', delay: number = 500) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (type === 'bot') {
      setIsTyping(true);
      // Adiciona indicador de digitação
      setChatMessages(prev => [...prev, { type, text: '', isTyping: true }]);
      
      // Simula tempo de digitação baseado no tamanho da mensagem
      const typingDelay = Math.min(message.length * 50, 2000);
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      
      // Remove indicador de digitação e adiciona mensagem completa
      setChatMessages(prev => prev.filter(msg => !msg.isTyping));
      setChatMessages(prev => [...prev, { type, text: message }]);
      setIsTyping(false);
    } else {
      setChatMessages(prev => [...prev, { type, text: message }]);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    
    // Add user message immediately
    await addMessageWithDelay(userMessage, 'user', 0);

    try {
      // Get responses from webhook
      const responses = await sendMessageToWebhook(userMessage);
      
      // Add each bot response
      for (const response of responses) {
        if (response.output) {
          // Split the response by double newlines and send each part as a separate message
          const messages = response.output.split('\n\n');
          for (const msg of messages) {
            await addMessageWithDelay(msg.trim(), 'bot', 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      await addMessageWithDelay(
        "Desculpe, ocorreu um erro inesperado. Por favor, tente novamente.",
        'bot'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    setShowChat(true);
    setIsLoading(true);

    // Wait for chat to become visible before scrolling
    setTimeout(() => {
      const chatInterface = document.querySelector('.chat-messages');
      if (chatInterface) {
        const headerOffset = 80; // Account for any fixed headers
        const elementPosition = chatInterface.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100); // Small delay to ensure DOM is updated
    
    try {
      // Add user message
      await addMessageWithDelay('Iniciar consulta gratuita', 'user', 0);

      // Send initial message and wait for responses
      const responses = await sendMessageToWebhook('Iniciar consulta gratuita');
      
      // Add each bot response
      for (const response of responses) {
        if (response.output) {
          // Split the response by double newlines and send each part as a separate message
          const messages = response.output.split('\n\n');
          for (const msg of messages) {
            await addMessageWithDelay(msg.trim(), 'bot', 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleStartChat:', error);
      await addMessageWithDelay(
        "Desculpe, estou com dificuldade para iniciar a consulta. Por favor, tente novamente em alguns instantes.",
        'bot'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const faqItems = [
    {
      question: "Quanto tempo leva para receber meu desenho?",
      answer: "O processo leva aproximadamente 5-7 dias. Você receberá seu desenho digitalizado por e-mail."
    },
    {
      question: "Como saber que o desenho realmente representa minha alma gêmea?",
      answer: "Cada desenho é criado através de um processo intuitivo e espiritual profundo, captando a energia única da sua alma gêmea."
    },
    {
      question: "E se eu já estiver em um relacionamento?",
      answer: "O desenho pode confirmar se seu atual parceiro(a) é sua alma gêmea ou revelar características de alguém que está por vir."
    },
    {
      question: "Existe garantia?",
      answer: "Sim! Oferecemos garantia de satisfação de 30 dias com devolução integral do investimento."
    }
  ];

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-[#0f0821]" />}>
        <Stars />
      </Suspense>
      
      {/* Header Section */}
      <header className="w-full bg-transparent py-8 min-h-fit flex flex-col">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-cinzel font-semibold text-golden mb-4 golden-glow">
              Chama Gêmea
            </h1>
            <p className="text-base font-cinzel font-semibold text-purple-200 mb-6 leading-tight">
              Sua conexão espiritual aguarda ser descoberta através de arte mística
            </p>
            <div className="max-w-3xl mx-auto bg-purple-900/10 backdrop-blur-md border border-purple-500/30 rounded-xl overflow-hidden">
              <div className="wistia_responsive_padding" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                <div className="wistia_responsive_wrapper" style={{ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }}>
                  <div className="wistia_embed wistia_async_bqs7hhuq1o videoFoam=true" style={{ height: '100%', position: 'relative', width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0 h-auto' : 'opacity-0 translate-y-10 h-0 overflow-hidden'}`}>
        {/* Chatbot Section - Moved to second position */}
        <section className="py-8 bg-transparent relative">
          <div className="container mx-auto px-4">

            {/* Chat Interface */}
            <div className="max-w-2xl mx-auto">
              <div className={`transition-all duration-300 ${showChat ? 'opacity-100 visible scale-y-100' : 'opacity-0 invisible absolute scale-y-95'}`}>
                <div className="bg-purple-900/10 backdrop-blur-md border border-purple-500/30 rounded-xl overflow-hidden fade-in">
                  {/* Chat Messages */}
                  <div ref={chatContainerRef} className="h-[32rem] overflow-y-auto p-6 space-y-4 chat-messages">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.isTyping ? (
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        ) : (
                          <div
                            className={`max-w-[80%] p-4 rounded-xl ${
                              msg.type === 'user'
                                ? 'bg-purple-600/30 text-white'
                                : 'bg-golden/10 text-purple-200'
                            }`}
                          >
                            {msg.text}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="border-t border-purple-500/30 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-purple-900/20 border border-purple-500/30 rounded-full px-6 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-golden/50"
                        disabled={isLoading}
                      />
                      <button
                        onClick={handleSendMessage}
                        className={`bg-golden hover:bg-golden/90 rounded-full p-3 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoading}
                      >
                        <Send className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`transition-all duration-300 ${!showChat ? 'opacity-100 visible scale-y-100' : 'opacity-0 invisible absolute scale-y-95'}`}>
                <button
                  onClick={handleStartChat}
                  className="w-full bg-purple-900/10 backdrop-blur-md border border-purple-500/30 rounded-xl p-8 flex items-center justify-center gap-4 hover:bg-purple-900/20 transition-all duration-300 fade-in"
                  disabled={isLoading}
                >
                  <MessageCircle className="w-6 h-6 text-golden" />
                  <span className="text-golden golden-glow font-cinzel font-semibold text-lg">Iniciar Consulta Gratuita</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16 fade-in">
                <h2 className="text-3xl font-cinzel font-semibold mb-6 text-white">
                  Revele o Rosto da Sua <span className="text-golden golden-glow">Chama Gêmea</span>
                </h2>
                <p className="text-lg text-purple-200">
                  Desenho personalizado revelando a imagem de quem o universo destinou para você
                </p>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 slide-in-left">
                  <div className="relative max-w-md mx-auto">
                    <img
                      src="https://i.postimg.cc/NFycHV9m/soulmate-drawing.jpg"
                      alt="Exemplo de desenho de alma gêmea"
                      className="rounded w-full border border-purple-500/30"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visualization Art Section */}
        <section className="py-8 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16 fade-in">
                <h2 className="text-3xl font-cinzel font-semibold mb-6 text-white">
                  A Arte de <span className="text-golden golden-glow">Visualizar Almas</span>
                </h2>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="w-full md:w-1/2 space-y-6 text-purple-200 order-2 md:order-1 slide-in-left">
                  <p className="text-lg">
                    Utilizando uma combinação ancestral de técnicas intuitivas e conexão com o plano energético, posso acessar as vibrações que atraem sua alma gêmea ao seu caminho.
                  </p>
                  <p className="text-lg">
                    Através do poder da visualização espiritual, canalizo a imagem da pessoa destinada a estar em sua vida, revelando traços físicos e detalhes que você reconhecerá quando o encontro ocorrer.
                  </p>
                  <p className="text-lg">
                    Este não é apenas um desenho, mas um portal para a manifestação do amor verdadeiro em sua vida.
                  </p>
                </div>
                <div className="w-full md:w-1/2 flex justify-center order-1 md:order-2 py-1 slide-in-right">
                  <div className="crystal-ball">
                    <div className="reflection"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="processo" className="py-8 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 fade-in">
              <h2 className="text-3xl font-cinzel font-semibold mb-6 text-white">
                O <span className="text-golden golden-glow">Processo Místico</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  icon: <Moon className="w-8 h-8 text-white" />,
                  title: "Conexão Energética",
                  description: "Após sua solicitação, realizo um ritual de conexão com seu campo energético para sintonizar com as vibrações da sua alma gêmea."
                },
                {
                  icon: <Eye className="w-8 h-8 text-white" />,
                  title: "Visualização",
                  description: "Durante um estado meditativo profundo, visualizo o rosto e características da pessoa destinada a cruzar seu caminho."
                },
                {
                  icon: <PaintBrush className="w-8 h-8 text-white" />,
                  title: "Criação Artística",
                  description: "Transfiro meticulosamente a imagem visualizada para o papel, capturando a essência e energia da sua alma gêmea."
                },
                {
                  icon: <Heart className="w-8 h-8 text-white" />,
                  title: "Entrega Reveladora",
                  description: "Receba seu desenho com orientações sobre como reconhecer esta pessoa quando ela surgir em sua vida."
                }
              ].map((step, index) => (
                <div
                  key={index}
                  className="bg-purple-900/10 backdrop-blur-md border border-purple-500/30 rounded-xl p-8 text-center transform hover:-translate-y-2 transition-transform duration-300 fade-in"
                >
                  <div className="w-16 h-16 mystical-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-cinzel font-semibold mb-4 text-white">{step.title}</h3>
                  <p className="text-purple-200">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="depoimentos" className="py-8 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 fade-in">
              <h2 className="text-3xl font-cinzel font-semibold mb-6 text-white">
                Histórias de <span className="text-golden golden-glow">Conexões Realizadas</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  image: "https://i.postimg.cc/J4f1b1Qn/testimonial-1.jpg",
                  text: "Quando recebi o desenho, guardei como uma simples curiosidade. Três meses depois, conheci alguém em um evento que era exatamente como no desenho. Hoje estamos juntos há 1 ano!",
                  name: "Mariana, 28"
                },
                {
                  image: "https://i.postimg.cc/YSkMsbZB/testimonial-2.jpg",
                  text: "Estava cética no início, mas os detalhes específicos do desenho me surpreenderam. A similaridade entre o retrato e a pessoa que conheci quatro meses depois não pode ser coincidência.",
                  name: "Camila, 32"
                },
                {
                  image: "https://i.postimg.cc/sXgyV13n/testimonial-3.jpg",
                  text: "O desenho revelou detalhes tão específicos que eu duvidei no início. Seis meses depois, conheci meu parceiro em uma viagem e a semelhança com o desenho me deixou sem palavras. Hoje estamos noivos!",
                  name: "Juliana, 31"
                }
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-purple-900/10 backdrop-blur-md border border-purple-500/30 rounded-xl p-8 fade-in"
                >
                  <div className="aspect-[3/4] mb-8 overflow-hidden rounded-lg border-2 border-purple-400">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-golden fill-golden" />
                    ))}
                  </div>
                  <p className="text-purple-200 text-center mb-4">{testimonial.text}</p>
                  <p className="text-purple-300 font-semibold text-center">{testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-cinzel font-semibold mb-6 text-white">
                Descubra Sua <span className="text-golden golden-glow">Chama Gêmea Agora</span>
              </h2>
              <p className="text-purple-200">Apenas um passo separa você da descoberta que mudará sua vida amorosa</p>
            </div>
            <div className="max-w-3xl mx-auto bg-purple-900/10 backdrop-blur-md border border-purple-500/30 rounded-xl p-12 fade-in">

              <div className="bg-purple-900/20 backdrop-blur-md rounded-xl p-8 mb-12 relative overflow-hidden">
                {/* Mystical Light Effects */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-golden/10 rounded-full blur-3xl"></div>
                
                <div className="relative flex flex-col items-center text-center">
                  <h3 className="text-2xl font-cinzel font-semibold mb-4 text-white">
                    Desenho Personalizado da Sua Chama Gêmea
                  </h3>
                  
                  <p className="text-lg text-purple-200 mb-8 max-w-lg">
                    Visualização mística com detalhes únicos de quem o universo reservou para você
                  </p>
                  
                  <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="text-red-400/80 line-through text-lg">
                      R$99,90
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-cinzel font-semibold golden-glow text-golden">R$</span>
                      <span className="text-6xl font-cinzel font-bold text-golden golden-glow tracking-tight">29</span>
                      <span className="text-2xl font-cinzel font-semibold golden-glow text-golden">,90</span>
                    </div>
                  </div>
                </div>
              </div>

              <a
                href={`https://pay.kirvano.com/94c43b96-6f55-4b60-9e9b-23b393a0326b${window.location.search}`}
                target="_blank"
                className="block w-full max-w-sm mx-auto py-3 px-6 bg-golden hover:bg-golden/90 rounded-full text-center text-white font-cinzel font-bold text-lg transition pulse mb-8 whitespace-nowrap"
              >
                Revelar Chama Gêmea
              </a>

              <ul className="space-y-4 mb-12">
                {[
                  "Acesso imediato ao ritual de conexão energética",
                  "Desenho detalhado da sua alma gêmea entregue por e-mail",
                  "Relatório energético de compatibilidade",
                  "Orientações para atrair o encontro",
                  "Garantia de satisfação de 30 dias"
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-4 text-purple-200">
                    <Check className="w-6 h-6 text-golden" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <Lock className="w-4 h-4" />
                  <span>Pagamento seguro</span>
                </div>
                <div className="flex justify-center items-center gap-2">
                  <FontAwesomeIcon icon={faCcVisa} className="h-6 text-white" />
                  <FontAwesomeIcon icon={faCcMastercard} className="h-6 text-white" />
                  <FontAwesomeIcon icon={faCcAmex} className="h-6 text-white" />
                  <FontAwesomeIcon icon={faPix} className="h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-8 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 fade-in">
              <h2 className="text-3xl font-cinzel font-semibold mb-6 text-white">
                Perguntas <span className="text-golden golden-glow">Frequentes</span>
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-purple-900/10 backdrop-blur-md border border-purple-500/30 rounded-xl overflow-hidden fade-in"
                >
                  <button
                    className="w-full px-8 py-6 flex items-center justify-between text-left"
                    onClick={() => toggleFaq(index)}
                  >
                    <h3 className="text-xl font-cinzel font-semibold text-white">{item.question}</h3>
                    {activeFaq === index ? (
                      <X className="w-6 h-6 text-purple-300 transition-transform" />
                    ) : (
                      <Plus className="w-6 h-6 text-purple-300 transition-transform" />
                    )}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      activeFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-8 pb-6 text-purple-200">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-transparent backdrop-blur-md border-t border-purple-500/20">
          <div className="container mx-auto px-4">
            <div className="text-center fade-in">
              <h2 className="text-2xl font-cinzel font-semibold mb-4 text-golden golden-glow">Chama Gêmea</h2>
              <p className="text-purple-300 mb-8">Unindo corações através da arte mística</p>
              <div className="text-sm text-purple-400">
                <p className="mb-6">© 2024 Chama Gêmea. Todos os direitos reservados.</p>
                <div className="flex justify-center items-center gap-4">
                  <a href={`/politica-de-privacidade${window.location.search}`} className="hover:text-purple-300 transition-colors">
                    Política de Privacidade
                  </a>
                  <span className="text-purple-500">•</span>
                  <a href={`/termos-e-condicoes${window.location.search}`} className="hover:text-purple-300 transition-colors">
                    Termos e Condições
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;