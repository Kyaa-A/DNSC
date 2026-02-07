import * as React from 'react'
import { BaseEmailTemplate } from './base-template'

interface OrganizerInvitationTemplateProps {
  organizerName: string
  inviteLink: string
  eventName?: string
}

export function OrganizerInvitationTemplate({ organizerName, inviteLink, eventName }: OrganizerInvitationTemplateProps) {
  return (
    <BaseEmailTemplate title="You're invited to organize with DNSC Attendance">
      <p style={{ 
        margin: '0 0 24px 0',
        fontSize: 15,
        lineHeight: 1.5
      }}>
        Hi <span style={{ color: '#22964d', fontWeight: 600 }}>{organizerName}</span>,
      </p>

      <div style={{ marginBottom: '32px' }}>
        <p style={{ 
          margin: '0 0 16px 0',
          fontSize: 15,
          color: '#1F2937',
          lineHeight: 1.6
        }}>
          {eventName ? (
            <>You have been invited to organize <strong style={{ color: '#000000' }}>{eventName}</strong> on the DNSC Attendance system.</>
          ) : (
            <>You have been invited to join the DNSC Attendance system as an organizer.</>
          )}
        </p>
        <p style={{ 
          margin: '0',
          fontSize: 15,
          color: '#1F2937',
          lineHeight: 1.6
        }}>
          Click the button below to accept the invitation and set up your account.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <a
          href={inviteLink}
          style={{
            display: 'inline-block',
            backgroundColor: '#22964d',
            color: '#ffffff',
            padding: '12px 32px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          Accept Invitation
        </a>
      </div>

      <div style={{
        padding: '16px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        marginTop: '32px'
      }}>
        <p style={{ 
          margin: '0 0 8px 0',
          fontSize: '14px',
          color: '#4B5563',
          lineHeight: 1.5
        }}>
          If the button does not work, copy and paste this link into your browser:
        </p>
        <a 
          href={inviteLink} 
          style={{ 
            color: '#2563EB', 
            textDecoration: 'none',
            fontSize: '14px',
            wordBreak: 'break-all',
            display: 'block'
          }}
        >
          {inviteLink}
        </a>
      </div>
    </BaseEmailTemplate>
  )
}


