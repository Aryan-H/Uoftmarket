
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-16 mt-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" className="mr-4" asChild>
              <Link to="/" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-toronto-dark">Privacy Policy</h1>
          </div>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              <section>
                <p className="text-gray-700 mb-4">
                  At UofT Market, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                <p className="text-gray-700">
                  We collect several types of information from and about users of our platform, including:
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  <li>Personal information such as name, email address, and student ID</li>
                  <li>Contact information including phone number and university email address</li>
                  <li>Transaction information when you list, buy, or sell items</li>
                  <li>User content such as listings, messages, and profile information</li>
                  <li>Technical data including IP address, browser type, and device information</li>
                  <li>Usage data about how you interact with our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                <p className="text-gray-700">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  <li>Provide, maintain, and improve our platform</li>
                  <li>Verify your university affiliation</li>
                  <li>Process transactions and send related notifications</li>
                  <li>Facilitate communication between buyers and sellers</li>
                  <li>Personalize your experience and deliver relevant content</li>
                  <li>Protect the safety and security of our users and platform</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
                <p className="text-gray-700">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  <li>With other users as necessary to facilitate transactions</li>
                  <li>With third-party service providers who perform services on our behalf</li>
                  <li>If required by law or to protect our rights or the rights of others</li>
                  <li>In connection with a business transaction such as a merger or acquisition</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
                <p className="text-gray-700">
                  We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Your Privacy Rights</h2>
                <p className="text-gray-700">
                  You have certain rights regarding your personal information, including:
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  <li>Accessing and updating your personal information</li>
                  <li>Requesting deletion of your data</li>
                  <li>Opting out of certain data uses</li>
                  <li>Withdrawing consent when applicable</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  To exercise these rights, please contact us using the information provided below.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking Technologies</h2>
                <p className="text-gray-700">
                  We use cookies and similar technologies to enhance your experience on our platform, understand user behavior, and improve our services. You can manage cookie preferences through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Third-Party Links</h2>
                <p className="text-gray-700">
                  Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Changes to This Privacy Policy</h2>
                <p className="text-gray-700">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              <section className="pb-4">
                <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
                <p className="text-gray-700">
                  If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
                </p>
                <p className="text-gray-700 mt-2">
                  Email: privacy@uoftmarket.com<br />
                  Address: University of Toronto, Ontario, Canada
                </p>
              </section>

              <div className="text-center text-gray-500 text-sm mt-8 pb-4">
                Last updated: {new Date().toLocaleDateString('en-CA', {year: 'numeric', month: 'long', day: 'numeric'})}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
