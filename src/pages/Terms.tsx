import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
const Terms = () => {
  const handlePrint = () => {
    window.print();
  };
  return <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-16 mt-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="mr-4" asChild>
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Link>
              </Button>
              <h1 className="text-3xl font-bold text-toronto-dark">Terms of Service</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" asChild>
                
              </Button>
            </div>
          </div>

          <div className="mb-6 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          </div>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-gray-700">
                  By accessing or using UofT Market, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you are not authorized to use the platform.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Eligibility</h2>
                <p className="text-gray-700">
                  UofT Market is exclusively available to current students, faculty, and staff of the University of Toronto. You must have a valid university email address ending in utoronto.ca to register and use our services.
                </p>
                <p className="text-gray-700 mt-2">
                  By creating an account, you represent and warrant that you are a current student, faculty member, or staff of the University of Toronto and that the information you provide during registration is accurate and complete.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                <p className="text-gray-700">
                  You are responsible for maintaining the confidentiality of your account information, including your password, and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
                <p className="text-gray-700 mt-2">
                  UofT Market reserves the right to refuse service, terminate accounts, remove or edit content, or cancel orders at our sole discretion.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Prohibited Items</h2>
                <p className="text-gray-700">
                  The following items are prohibited from being listed or sold on UofT Market:
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-700 ml-4 space-y-1">
                  <li>Illegal items or services</li>
                  <li>Counterfeit or fraudulent products</li>
                  <li>Dangerous or hazardous materials</li>
                  <li>Weapons or explosives</li>
                  <li>Alcohol, tobacco, e-cigarettes, or drugs</li>
                  <li>Stolen property</li>
                  <li>Academic materials that violate academic integrity (e.g., completed assignments, exam solutions)</li>
                  <li>Items that infringe on intellectual property rights</li>
                  <li>Personally identifiable information</li>
                  <li>Adult or explicit content</li>
                  <li>Animals or animal products</li>
                  <li>Any products or services that violate University of Toronto policies</li>
                </ul>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">5. User Conduct</h2>
                <p className="text-gray-700">
                  Users are expected to interact respectfully and professionally. Any form of harassment, discrimination, or inappropriate behavior will not be tolerated and may result in account suspension or termination.
                </p>
                <p className="text-gray-700 mt-2">
                  You agree not to use UofT Market for any illegal or unauthorized purpose. You must not attempt to interfere with the proper functioning of the platform.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Listings and Transactions</h2>
                <p className="text-gray-700">
                  All listings must be accurate and truthful. Sellers are responsible for delivering items as described, and buyers are responsible for completing payment as agreed upon. UofT Market serves as a platform for connecting buyers and sellers but is not directly involved in transactions between users.
                </p>
                <p className="text-gray-700 mt-2">
                  Sellers must accurately describe their items, including any defects or damages. Prices must be listed in Canadian Dollars (CAD) and represent the actual selling price.
                </p>
                <p className="text-gray-700 mt-2">
                  We strongly recommend meeting in public, well-lit areas on or near campus for in-person transactions. University buildings, libraries, or populated campus locations are ideal meeting spots.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
                <p className="text-gray-700">
                  All content on UofT Market, including but not limited to text, graphics, logos, and software, is the property of UofT Market or its content suppliers and is protected by Canadian and international copyright laws.
                </p>
                <p className="text-gray-700 mt-2">
                  You retain all ownership rights to the content you post on UofT Market, but by posting content, you grant UofT Market a non-exclusive, royalty-free license to use, display, and distribute your content in connection with the service.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
                <p className="text-gray-700">
                  UofT Market is not liable for any direct, indirect, incidental, special, or consequential damages that result from the use of, or the inability to use, the platform or services.
                </p>
                <p className="text-gray-700 mt-2">
                  UofT Market does not guarantee the quality, safety, or legality of items listed, the truth or accuracy of listings, the ability of sellers to sell items, or that buyers will complete transactions.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
                <p className="text-gray-700">
                  UofT Market reserves the right to modify these Terms of Service at any time. We will provide notice of significant changes through the platform. Your continued use of UofT Market after such modifications constitutes your acceptance of the revised terms.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
                <p className="text-gray-700">
                  UofT Market reserves the right to terminate or suspend your account and access to the platform at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
                <p className="text-gray-700">
                  These Terms of Service are governed by the laws of Ontario, Canada, without regard to its conflict of law provisions. You agree to submit to the personal and exclusive jurisdiction of the courts located within Toronto, Ontario.
                </p>
              </section>

              <Separator />

              <section className="pb-4">
                <h2 className="text-xl font-semibold mb-3">12. Contact Information</h2>
                <p className="text-gray-700">
                  If you have any questions about these Terms of Service, please contact us at <a href="mailto:uoftmarket@gmail.com" className="text-toronto-blue hover:underline">uoftmarket@gmail.com</a>.
                </p>
              </section>
            </div>
          </ScrollArea>

          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
            <Button variant="outline" asChild>
              <Link to="/privacy">Privacy Policy</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/faq">FAQ</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>;
};
export default Terms;