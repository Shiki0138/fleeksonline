/**
 * Conversational AI Assistant Service
 * Multi-modal support with voice and text for beauty consultations
 */

const natural = require('natural');
const { NlpManager } = require('node-nlp');

class ConversationalAIService {
  constructor() {
    this.nlpManager = null;
    this.contextManager = new Map();
    this.responseCache = new Map();
    this.intents = null;
    this.initialized = false;
  }

  /**
   * Initialize the conversational AI system
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize NLP manager
      this.nlpManager = new NlpManager({ 
        languages: ['en'],
        forceNER: true
      });

      // Load beauty-specific intents
      await this.loadIntents();
      
      // Train the model
      await this.trainModel();
      
      // Initialize response templates
      this.initializeResponseTemplates();
      
      this.initialized = true;
      console.log('Conversational AI service initialized');
    } catch (error) {
      console.error('Failed to initialize conversational AI:', error);
      throw error;
    }
  }

  /**
   * Process user query and generate response
   * @param {string} input - User input (text or transcribed voice)
   * @param {string} userId - User identifier
   * @param {Object} context - Conversation context
   * @returns {Object} AI response
   */
  async processQuery(input, userId, context = {}) {
    await this.initialize();

    // Get or create conversation context
    const conversationContext = this.getConversationContext(userId);
    
    // Process with NLP
    const nlpResult = await this.nlpManager.process('en', input);
    
    // Extract entities and intent
    const intent = nlpResult.intent;
    const entities = nlpResult.entities;
    const sentiment = nlpResult.sentiment;
    
    // Check cache for common queries
    const cachedResponse = this.checkResponseCache(intent, entities);
    if (cachedResponse && !this.requiresPersonalization(intent)) {
      return this.formatResponse(cachedResponse, context);
    }
    
    // Generate personalized response
    const response = await this.generateResponse({
      intent,
      entities,
      sentiment,
      conversationContext,
      userContext: context
    });
    
    // Update conversation context
    this.updateConversationContext(userId, {
      lastIntent: intent,
      lastEntities: entities,
      lastResponse: response,
      timestamp: Date.now()
    });
    
    // Format and return response
    return this.formatResponse(response, context);
  }

  /**
   * Load beauty salon specific intents
   */
  async loadIntents() {
    const intents = {
      // Booking intents
      'booking.create': {
        utterances: [
          'I want to book an appointment',
          'Can I schedule a haircut',
          'Book me a facial',
          'I need to make a reservation',
          'Schedule an appointment for'
        ],
        answers: ['booking_create']
      },
      
      'booking.check': {
        utterances: [
          'What appointments do I have',
          'Check my bookings',
          'When is my next appointment',
          'Show my schedule'
        ],
        answers: ['booking_check']
      },
      
      'booking.cancel': {
        utterances: [
          'Cancel my appointment',
          'I need to cancel',
          'Remove my booking',
          'Delete my reservation'
        ],
        answers: ['booking_cancel']
      },
      
      // Service inquiries
      'service.info': {
        utterances: [
          'What services do you offer',
          'Tell me about facials',
          'What kind of haircuts',
          'Explain your treatments',
          'Service menu'
        ],
        answers: ['service_info']
      },
      
      'service.price': {
        utterances: [
          'How much for a haircut',
          'What are your prices',
          'Cost of facial',
          'Price list',
          'How expensive'
        ],
        answers: ['service_price']
      },
      
      'service.duration': {
        utterances: [
          'How long does it take',
          'Duration of treatment',
          'Time for haircut',
          'How many hours'
        ],
        answers: ['service_duration']
      },
      
      // Recommendations
      'recommend.service': {
        utterances: [
          'What do you recommend',
          'Best treatment for me',
          'Suggest a service',
          'What should I get',
          'Help me choose'
        ],
        answers: ['recommend_service']
      },
      
      'recommend.style': {
        utterances: [
          'What hairstyle suits me',
          'Best hair color for me',
          'Style advice',
          'Makeup suggestions'
        ],
        answers: ['recommend_style']
      },
      
      // Staff related
      'staff.availability': {
        utterances: [
          'Is Sarah available',
          'Who can cut my hair',
          'Available stylists',
          'Staff schedule'
        ],
        answers: ['staff_availability']
      },
      
      'staff.expertise': {
        utterances: [
          'Who is best for coloring',
          'Expert in curly hair',
          'Specialist for',
          'Who should I book with'
        ],
        answers: ['staff_expertise']
      },
      
      // General queries
      'hours.operation': {
        utterances: [
          'What time do you open',
          'Are you open now',
          'Business hours',
          'When do you close'
        ],
        answers: ['hours_operation']
      },
      
      'location.info': {
        utterances: [
          'Where are you located',
          'Address please',
          'How to get there',
          'Parking available'
        ],
        answers: ['location_info']
      }
    };

    // Add intents to NLP manager
    for (const [intentName, intentData] of Object.entries(intents)) {
      // Add utterances
      for (const utterance of intentData.utterances) {
        this.nlpManager.addDocument('en', utterance, intentName);
      }
      
      // Add entities
      this.addEntitiesForIntent(intentName);
    }

    this.intents = intents;
  }

  /**
   * Add entities for specific intents
   */
  addEntitiesForIntent(intentName) {
    // Service entities
    this.nlpManager.addNamedEntityText(
      'service',
      'haircut',
      ['en'],
      ['haircut', 'hair cut', 'cut']
    );
    
    this.nlpManager.addNamedEntityText(
      'service',
      'facial',
      ['en'],
      ['facial', 'face treatment']
    );
    
    this.nlpManager.addNamedEntityText(
      'service',
      'manicure',
      ['en'],
      ['manicure', 'nails', 'nail treatment']
    );
    
    // Time entities
    this.nlpManager.addNamedEntityText(
      'time',
      'tomorrow',
      ['en'],
      ['tomorrow', 'next day']
    );
    
    this.nlpManager.addNamedEntityText(
      'time',
      'today',
      ['en'],
      ['today', 'this day']
    );
    
    // Staff entities
    this.nlpManager.addNamedEntityText(
      'staff',
      'any',
      ['en'],
      ['anyone', 'any stylist', 'whoever']
    );
  }

  /**
   * Train the NLP model
   */
  async trainModel() {
    await this.nlpManager.train();
  }

  /**
   * Generate response based on intent and context
   */
  async generateResponse({ intent, entities, sentiment, conversationContext, userContext }) {
    // Get response template
    const template = this.getResponseTemplate(intent);
    
    // Personalize based on context
    const personalizedResponse = await this.personalizeResponse(
      template,
      {
        entities,
        sentiment,
        history: conversationContext,
        user: userContext
      }
    );
    
    // Add follow-up suggestions
    const suggestions = this.generateSuggestions(intent, entities);
    
    return {
      text: personalizedResponse,
      intent: intent,
      confidence: 0.9,
      suggestions: suggestions,
      requiresAction: this.requiresAction(intent),
      emotion: this.determineResponseEmotion(sentiment)
    };
  }

  /**
   * Initialize response templates
   */
  initializeResponseTemplates() {
    this.responseTemplates = {
      'booking.create': {
        base: "I'd be happy to help you book an appointment! What service would you like to book?",
        personalized: "Great! I can help you book {service}. When would you prefer to come in?",
        withStaff: "Perfect! I'll check {staff}'s availability for {service}. What day works best for you?"
      },
      
      'service.info': {
        base: "We offer a full range of beauty services including haircuts, coloring, facials, manicures, pedicures, and various spa treatments. What are you interested in?",
        specific: "Our {service} treatments are very popular! We offer several options ranging from basic to premium. Would you like to know more details?"
      },
      
      'service.price': {
        base: "Our prices vary by service and stylist level. What specific service pricing would you like to know about?",
        specific: "A {service} starts at ${price} and can go up to ${maxPrice} depending on the complexity and stylist level."
      },
      
      'recommend.service': {
        base: "I'd love to recommend the perfect service for you! Could you tell me a bit about what you're looking for or any specific concerns?",
        personalized: "Based on your preferences, I'd recommend our {recommendation}. It's perfect for {reason}. Would you like to book it?"
      },
      
      'hours.operation': {
        base: "We're open Monday-Friday 9 AM to 8 PM, Saturday 9 AM to 6 PM, and Sunday 10 AM to 5 PM.",
        current: "We're currently {status}. {nextAvailable}"
      },
      
      'greeting': {
        base: "Hello! Welcome to Fleeks Beauty Salon. How can I help you today?",
        returning: "Welcome back! It's great to see you again. How can I assist you today?"
      },
      
      'fallback': {
        base: "I'm not quite sure I understood that. Could you please rephrase or tell me more about what you're looking for?",
        helpful: "I can help you with booking appointments, information about our services, pricing, recommendations, or general questions about the salon."
      }
    };
  }

  /**
   * Get response template for intent
   */
  getResponseTemplate(intent) {
    return this.responseTemplates[intent] || this.responseTemplates.fallback;
  }

  /**
   * Personalize response based on context
   */
  async personalizeResponse(template, context) {
    let response = template.base;
    
    // Check if we have entity-specific responses
    if (context.entities.length > 0) {
      const primaryEntity = context.entities[0];
      
      if (primaryEntity.entity === 'service' && template.specific) {
        response = template.specific.replace('{service}', primaryEntity.option);
        
        // Add pricing if available
        const pricing = await this.getServicePricing(primaryEntity.option);
        if (pricing) {
          response = response
            .replace('{price}', pricing.min)
            .replace('{maxPrice}', pricing.max);
        }
      }
      
      if (primaryEntity.entity === 'staff' && template.withStaff) {
        response = template.withStaff
          .replace('{staff}', primaryEntity.option)
          .replace('{service}', context.entities.find(e => e.entity === 'service')?.option || 'that service');
      }
    }
    
    // Add time-based personalization
    const timePersonalization = this.getTimeBasedGreeting();
    if (context.history.lastIntent === null) {
      response = `${timePersonalization} ${response}`;
    }
    
    // Sentiment-based adjustments
    if (context.sentiment.score < -0.5) {
      response = `I understand this might be frustrating. ${response}`;
    }
    
    return response;
  }

  /**
   * Generate follow-up suggestions
   */
  generateSuggestions(intent, entities) {
    const suggestions = {
      'booking.create': [
        'View available times',
        'See our services',
        'Choose a stylist'
      ],
      'service.info': [
        'Book this service',
        'See prices',
        'View gallery'
      ],
      'service.price': [
        'Book appointment',
        'See package deals',
        'View all prices'
      ],
      'recommend.service': [
        'Book recommended service',
        'Learn more',
        'See alternatives'
      ],
      'fallback': [
        'Book appointment',
        'View services',
        'Contact us'
      ]
    };
    
    return suggestions[intent] || suggestions.fallback;
  }

  /**
   * Check if intent requires action
   */
  requiresAction(intent) {
    const actionIntents = [
      'booking.create',
      'booking.cancel',
      'booking.modify'
    ];
    
    return actionIntents.includes(intent);
  }

  /**
   * Determine response emotion
   */
  determineResponseEmotion(sentiment) {
    if (sentiment.score > 0.5) return 'positive';
    if (sentiment.score < -0.5) return 'empathetic';
    return 'neutral';
  }

  /**
   * Get time-based greeting
   */
  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  }

  /**
   * Format response for different channels
   */
  formatResponse(response, context) {
    const formatted = {
      ...response,
      channel: context.channel || 'web',
      timestamp: new Date().toISOString()
    };
    
    // Channel-specific formatting
    if (context.channel === 'voice') {
      formatted.ssml = this.generateSSML(response.text);
      formatted.visualCards = null;
    } else if (context.channel === 'mobile') {
      formatted.mobileOptimized = true;
      formatted.quickReplies = response.suggestions.slice(0, 3);
    }
    
    return formatted;
  }

  /**
   * Generate SSML for voice responses
   */
  generateSSML(text) {
    return `<speak>
      <prosody rate="medium" pitch="medium">
        ${text}
      </prosody>
    </speak>`;
  }

  /**
   * Conversation context management
   */
  getConversationContext(userId) {
    if (!this.contextManager.has(userId)) {
      this.contextManager.set(userId, {
        userId,
        startTime: Date.now(),
        turns: 0,
        lastIntent: null,
        lastEntities: [],
        topics: []
      });
    }
    
    return this.contextManager.get(userId);
  }

  updateConversationContext(userId, update) {
    const context = this.getConversationContext(userId);
    Object.assign(context, update);
    context.turns++;
    
    // Add topic tracking
    if (update.lastIntent) {
      const topic = update.lastIntent.split('.')[0];
      if (!context.topics.includes(topic)) {
        context.topics.push(topic);
      }
    }
    
    this.contextManager.set(userId, context);
  }

  /**
   * Response caching
   */
  checkResponseCache(intent, entities) {
    const cacheKey = `${intent}_${JSON.stringify(entities)}`;
    return this.responseCache.get(cacheKey);
  }

  requiresPersonalization(intent) {
    const personalizedIntents = [
      'recommend.service',
      'recommend.style',
      'booking.create'
    ];
    
    return personalizedIntents.includes(intent);
  }

  /**
   * Get service pricing (mock implementation)
   */
  async getServicePricing(service) {
    const pricing = {
      'haircut': { min: 45, max: 120 },
      'facial': { min: 80, max: 200 },
      'manicure': { min: 35, max: 75 },
      'coloring': { min: 85, max: 300 }
    };
    
    return pricing[service.toLowerCase()];
  }

  /**
   * Handle voice input
   * @param {Buffer} audioBuffer - Audio buffer from voice input
   * @param {string} userId - User identifier
   * @returns {Object} Processed response
   */
  async processVoiceInput(audioBuffer, userId) {
    // In production, this would use a speech-to-text service
    // For now, we'll simulate it
    const transcribedText = "I want to book a haircut for tomorrow";
    
    console.log('Voice input transcribed:', transcribedText);
    
    // Process as regular text with voice context
    return await this.processQuery(transcribedText, userId, {
      channel: 'voice',
      inputType: 'speech'
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.contextManager.clear();
    this.responseCache.clear();
    this.initialized = false;
  }
}

module.exports = ConversationalAIService;