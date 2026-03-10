
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  const faqCategories = [
    { id: "general", name: "General" },
    { id: "account", name: "Account & Registration" },
    { id: "buying", name: "Buying & Selling" },
    { id: "safety", name: "Safety & Security" },
    { id: "technical", name: "Technical Issues" },
  ];

  const faqItems = [
    // General
    { 
      id: "item-1", 
      category: "general", 
      question: "What is UofT Market?", 
      answer: "UofT Market is an exclusive marketplace for University of Toronto students, faculty, and staff to buy and sell items within the university community. Our platform facilitates safe, local transactions between verified UofT members." 
    },
    { 
      id: "item-2", 
      category: "general", 
      question: "Who can use UofT Market?", 
      answer: "UofT Market is exclusively for current University of Toronto students, faculty, and staff. You must have a valid UofT email address to register and use our platform." 
    },
    { 
      id: "item-3", 
      category: "general", 
      question: "Is UofT Market free to use?", 
      answer: "Yes, UofT Market is completely free to use. There are no fees for listing items, making purchases, or communicating with other users." 
    },
    { 
      id: "item-4", 
      category: "general", 
      question: "Is UofT Market affiliated with the University of Toronto?", 
      answer: "UofT Market is an independent platform created by UofT students for the UofT community. While we serve the university community, we are not officially affiliated with or endorsed by the University of Toronto." 
    },
    
    // Account & Registration
    { 
      id: "item-5", 
      category: "account", 
      question: "How do I create an account?", 
      answer: "Click on the 'Sign In' button in the top-right corner of the page, then select 'Create Account.' You'll need to provide your UofT email address and create a password. We'll send a verification email to confirm your account." 
    },
    { 
      id: "item-6", 
      category: "account", 
      question: "I didn't receive my verification email. What should I do?", 
      answer: "First, check your spam or junk folder. If you still don't see the email, you can request a new verification email from the login page by clicking 'Resend verification email.' If problems persist, please contact our support team." 
    },
    { 
      id: "item-7", 
      category: "account", 
      question: "How do I reset my password?", 
      answer: "On the login page, click 'Forgot Password?' and enter your UofT email address. We'll send you instructions on how to reset your password. For security reasons, password reset links expire after 24 hours." 
    },
    { 
      id: "item-8", 
      category: "account", 
      question: "Can I use UofT Market after I graduate?", 
      answer: "Currently, you need an active UofT email address to maintain account access. We're exploring options for alumni access in the future. If you're about to graduate, we recommend updating your contact information in your account settings." 
    },
    
    // Buying & Selling
    { 
      id: "item-9", 
      category: "buying", 
      question: "How do I list an item for sale?", 
      answer: "After signing in, click on 'Sell' in the navigation menu. Fill out the listing form with details about your item, including title, description, price, category, condition, and photos. Review your listing information before submitting it." 
    },
    { 
      id: "item-10", 
      category: "buying", 
      question: "What items are not allowed on UofT Market?", 
      answer: "Prohibited items include: illegal goods or services, counterfeit products, dangerous materials, weapons, alcohol, tobacco, drugs, stolen property, academic materials that violate academic integrity, and items that infringe on intellectual property rights. Please review our Terms of Service for a complete list." 
    },
    { 
      id: "item-11", 
      category: "buying", 
      question: "How do transactions work?", 
      answer: "UofT Market facilitates connections between buyers and sellers, but we don't process payments directly. Buyers and sellers communicate through our messaging system to arrange payment methods and meeting locations for the exchange. We recommend meeting in public places on campus for safety." 
    },
    { 
      id: "item-12", 
      category: "buying", 
      question: "How do I contact a seller?", 
      answer: "On the product listing page, click the 'Contact Seller' button to start a conversation. All communications are handled through our built-in messaging system for security and privacy." 
    },
    { 
      id: "item-13", 
      category: "buying", 
      question: "Can I negotiate the price?", 
      answer: "Yes, price negotiation is common on UofT Market. You can discuss the price with the seller through our messaging system. Be respectful and reasonable with your offers." 
    },
    
    // Safety & Security
    { 
      id: "item-14", 
      category: "safety", 
      question: "How does UofT Market ensure safety?", 
      answer: "We verify all users through their UofT email addresses, creating a trusted community. We also provide built-in messaging so you don't need to share personal contact information. Additionally, we recommend meeting in public spaces on campus for exchanges." 
    },
    { 
      id: "item-15", 
      category: "safety", 
      question: "What should I do if I encounter a suspicious user or listing?", 
      answer: "Please report any suspicious activity by clicking the 'Report' button on listings or user profiles. Our team will investigate promptly. Never proceed with a transaction if you feel uncomfortable or suspect fraud." 
    },
    { 
      id: "item-16", 
      category: "safety", 
      question: "Does UofT Market offer any buyer or seller protection?", 
      answer: "While we don't offer financial protection or guarantee transactions, we create a safer environment by limiting membership to verified UofT community members. We recommend thoroughly inspecting items before purchase and using secure payment methods." 
    },
    { 
      id: "item-17", 
      category: "safety", 
      question: "Where should I meet for in-person transactions?", 
      answer: "We recommend meeting in public, well-lit areas on or near campus during daylight hours. University buildings, libraries, or populated campus locations are ideal meeting spots. Never meet at private residences or isolated areas for your first transaction with someone." 
    },
    
    // Technical Issues
    { 
      id: "item-18", 
      category: "technical", 
      question: "The app isn't working properly. What should I do?", 
      answer: "Try refreshing your browser or clearing your cache. If you're using the mobile app, try closing and reopening it. If problems persist, check our social media channels for any announced maintenance, or contact our support team." 
    },
    { 
      id: "item-19", 
      category: "technical", 
      question: "How do I upload multiple photos to my listing?", 
      answer: "When creating or editing a listing, you can upload multiple photos by clicking the 'Add Photos' button multiple times or by selecting multiple files at once (hold Ctrl/Cmd while selecting files in the file picker)." 
    },
    { 
      id: "item-20", 
      category: "technical", 
      question: "I can't send messages. What's wrong?", 
      answer: "First, check your internet connection. If you're still having issues, try logging out and back in. If the problem persists, it might be a temporary server issue. Please try again later or contact our support team." 
    }
  ];

  const filteredFaqItems = searchQuery.trim() 
    ? faqItems.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqItems.filter(item => item.category === activeTab);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-16 mt-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="mr-4" asChild>
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Link>
              </Button>
              <h1 className="text-3xl font-bold text-toronto-dark">Frequently Asked Questions</h1>
            </div>
            <HelpCircle className="h-8 w-8 text-toronto-blue" />
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search FAQ..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery.trim() === "" && (
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
                {faqCategories.map(category => (
                  <TabsTrigger key={category.id} value={category.id} className="whitespace-nowrap">
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {searchQuery.trim() !== "" && (
                <p className="text-sm text-gray-500 mb-4">
                  {filteredFaqItems.length} results found for "{searchQuery}"
                </p>
              )}

              {filteredFaqItems.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqItems.map(item => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-left font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-10">
                  <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No matching questions found</h3>
                  <p className="text-gray-500 mb-6">
                    Try different keywords or browse by category
                  </p>
                  {searchQuery.trim() !== "" && (
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-700 mb-4">
              Can't find an answer to your question? Contact us at <a href="mailto:uoftmarket@gmail.com" className="text-toronto-blue hover:underline">uoftmarket@gmail.com</a>
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/terms">Terms of Service</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/privacy">Privacy Policy</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
