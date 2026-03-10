import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingBag, Users, Library, Award, Map, PhoneCall, GraduationCap, BookOpen, Globe, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
const About = () => {
  const fadeIn = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };
  return <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section with improved design */}
        <section className="bg-gradient-to-br from-toronto-blue to-toronto-blue/80 text-white py-24">
          <motion.div className="container mx-auto px-4 text-center" initial="hidden" whileInView="visible" viewport={{
          once: true
        }} transition={{
          duration: 0.7
        }} variants={fadeIn}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display">About UofT Market</h1>
            <p className="text-xl max-w-3xl mx-auto opacity-90 leading-relaxed">
              A marketplace built by students, for students, fostering a sustainable 
              and affordable campus economy.
            </p>
          </motion.div>
        </section>

        {/* Mission Section with improved typography and layout */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div className="max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} transition={{
            duration: 0.7,
            delay: 0.1
          }} variants={fadeIn}>
              <h2 className="text-3xl font-bold mb-8 text-center text-toronto-dark font-display">Our Mission</h2>
              <div className="bg-gray-50 p-8 rounded-xl shadow-sm border border-gray-100">
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  UofT Market was founded with a simple mission: to create a dedicated, safe, and efficient 
                  marketplace exclusively for University of Toronto students. We believe in fostering a 
                  community where students can buy and sell goods, find housing, exchange textbooks, 
                  and offer services without the hassles and risks of general marketplaces.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  By keeping our platform exclusive to the UofT community, we provide a trusted 
                  environment where students can connect with peers who understand their specific 
                  needs and circumstances. We're committed to sustainability, affordability, 
                  and building a vibrant campus economy.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid with improved styling and animations */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{
            once: true
          }} transition={{
            duration: 0.5
          }} variants={fadeIn}>
              <h2 className="text-3xl font-bold mb-12 text-center text-toronto-dark font-display">Why Choose UofT Market</h2>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[{
              icon: <ShoppingBag className="h-7 w-7 text-white" />,
              title: "Student Exclusive",
              description: "Only verified UofT students can access our platform, creating a safer and more relevant marketplace."
            }, {
              icon: <Users className="h-7 w-7 text-white" />,
              title: "Community Focused",
              description: "Built with the specific needs of the UofT student community in mind."
            }, {
              icon: <Library className="h-7 w-7 text-white" />,
              title: "Course-Specific",
              description: "Find textbooks and resources organized by UofT courses and programs."
            }, {
              icon: <Map className="h-7 w-7 text-white" />,
              title: "Campus Proximity",
              description: "Filter listings by campus location for convenient exchanges."
            }, {
              icon: <Award className="h-7 w-7 text-white" />,
              title: "Verified Profiles",
              description: "Build trust with verified student profiles and ratings."
            }, {
              icon: <PhoneCall className="h-7 w-7 text-white" />,
              title: "Student Support",
              description: "Dedicated support team to help with any issues or questions."
            }, {
              icon: <GraduationCap className="h-7 w-7 text-white" />,
              title: "Academic Focus",
              description: "Resources prioritized based on academic relevance and usefulness."
            }, {
              icon: <BookOpen className="h-7 w-7 text-white" />,
              title: "Knowledge Sharing",
              description: "Platform to exchange not just items, but also knowledge and experiences."
            }, {
              icon: <Globe className="h-7 w-7 text-white" />,
              title: "Campus-Wide Network",
              description: "Connect with students across all three UofT campuses."
            }].map((feature, index) => <motion.div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow" initial="hidden" whileInView="visible" viewport={{
              once: true
            }} transition={{
              duration: 0.5,
              delay: index * 0.1
            }} variants={fadeIn}>
                  <div className="bg-toronto-blue p-4">
                    <div className="rounded-full bg-toronto-gold/20 p-3 w-14 h-14 flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-toronto-dark">{feature.title}</h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>)}
            </div>
          </div>
        </section>

        {/* Contact CTA with improved call-to-action */}
        
      </main>
      
      <Footer />
    </div>;
};
export default About;