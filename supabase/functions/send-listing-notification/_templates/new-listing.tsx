
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface NewListingEmailProps {
  listingTitle: string;
  listingPrice: number;
  sellerName: string;
  category: string;
  location: string;
  imageUrl?: string;
  listingUrl: string;
}

export const NewListingEmail = ({
  listingTitle,
  listingPrice,
  sellerName,
  category,
  location,
  imageUrl,
  listingUrl,
}: NewListingEmailProps) => (
  <Html>
    <Head />
    <Preview>New listing: {listingTitle} - ${listingPrice}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={greeting}>Hello,</Text>
        
        <Text style={mainText}>
          A new listing has been posted on UofT Market that matches your notification preferences:
        </Text>
        
        <Section style={listingSection}>
          <Text style={listingTitle}><strong>{listingTitle}</strong></Text>
          <Text style={priceText}>Price: ${listingPrice}</Text>
          <Text style={detailText}>Category: {category}</Text>
          <Text style={detailText}>Location: {location}</Text>
          <Text style={detailText}>Posted by: {sellerName}</Text>
        </Section>
        
        <Text style={mainText}>
          To view the full listing details and contact the seller, please visit:
        </Text>
        
        <Text style={linkText}>
          <Link href={listingUrl} style={link}>
            {listingUrl}
          </Link>
        </Text>
        
        <Text style={footerText}>
          Best regards,<br/>
          UofT Market Team
        </Text>
        
        <Text style={unsubscribeText}>
          You are receiving this email because you have enabled new listing notifications. 
          To modify your notification preferences, visit: <Link href={`${listingUrl.split('/product')[0]}/account`} style={link}>your account settings</Link>.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  padding: '20px',
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
};

const greeting = {
  fontSize: '16px',
  color: '#333',
  margin: '0 0 16px 0',
};

const mainText = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
};

const listingSection = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  border: '1px solid #e1e5e9',
  margin: '16px 0',
};

const listingTitle = {
  fontSize: '16px',
  color: '#333',
  margin: '0 0 8px 0',
};

const priceText = {
  fontSize: '14px',
  color: '#333',
  margin: '0 0 4px 0',
};

const detailText = {
  fontSize: '14px',
  color: '#333',
  margin: '0 0 4px 0',
};

const linkText = {
  fontSize: '14px',
  margin: '16px 0',
};

const footerText = {
  fontSize: '14px',
  color: '#333',
  margin: '24px 0 16px 0',
};

const unsubscribeText = {
  fontSize: '12px',
  color: '#666',
  margin: '16px 0',
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};

export default NewListingEmail;
