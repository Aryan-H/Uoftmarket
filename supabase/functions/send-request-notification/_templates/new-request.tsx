import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface NewRequestEmailProps {
  requestTitle: string
  requestDescription: string
  requestBudget: number | null
  requesterName: string
  category: string
  requestUrl: string
}

export const NewRequestEmail = ({
  requestTitle,
  requestDescription,
  requestBudget,
  requesterName,
  category,
  requestUrl,
}: NewRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>New request: {requestTitle} - {requestBudget ? `$${requestBudget}` : 'Budget not specified'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={greeting}>Hello,</Text>

        <Text style={mainText}>
          A new request has been posted on UofT Market that matches your notification preferences:
        </Text>

        <Section style={requestSection}>
          <Text style={requestTitleStyle}><strong>{requestTitle}</strong></Text>
          <Text style={budgetText}>Budget: {requestBudget ? `$${requestBudget}` : 'Not specified'}</Text>
          <Text style={detailText}>Category: {category}</Text>
          <Text style={detailText}>Requested by: {requesterName}</Text>
          {requestDescription && (
            <Text style={detailText}>Details: {requestDescription}</Text>
          )}
        </Section>

        <Text style={mainText}>
          To view the full request and contact the requester, please visit:
        </Text>

        <Text style={linkText}>
          <Link href={requestUrl} style={link}>
            {requestUrl}
          </Link>
        </Text>

        <Text style={footerText}>
          Best regards,<br/>
          UofT Market Team
        </Text>

        <Text style={unsubscribeText}>
          You are receiving this email because you have enabled new request notifications.
          To modify your notification preferences, visit: <Link href={`${requestUrl.split('/request')[0]}/account`} style={link}>your account settings</Link>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default NewRequestEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  padding: '20px',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
}

const greeting = {
  fontSize: '16px',
  color: '#333',
  margin: '0 0 16px 0',
}

const mainText = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const requestSection = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  border: '1px solid #e1e5e9',
  margin: '16px 0',
}

const requestTitleStyle = {
  fontSize: '16px',
  color: '#333',
  margin: '0 0 8px 0',
}

const budgetText = {
  fontSize: '14px',
  color: '#333',
  margin: '0 0 4px 0',
}

const detailText = {
  fontSize: '14px',
  color: '#333',
  margin: '0 0 4px 0',
}

const linkText = {
  fontSize: '14px',
  margin: '16px 0',
}

const footerText = {
  fontSize: '14px',
  color: '#333',
  margin: '24px 0 16px 0',
}

const unsubscribeText = {
  fontSize: '12px',
  color: '#666',
  margin: '16px 0',
}

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
}