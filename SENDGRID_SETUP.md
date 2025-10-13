# SendGrid Configuration for Application Console

This document outlines how to configure SendGrid for the Application Console email service using the domain `appconsole.tech`.

## DNS Configuration

Based on the SendGrid setup, you need to add the following DNS records to your domain `appconsole.tech`:

### Required DNS Records

| Type | Host | Value |
|------|------|-------|
| CNAME | `url7817.appconsole.tech` | `sendgrid.net` |
| CNAME | `56612513.appconsole.tech` | `sendgrid.net` |
| CNAME | `em4569.appconsole.tech` | `u56612513.wl014.sendgrid.net` |
| CNAME | `s1._domainkey.appconsole.tech` | `s1.domainkey.u56612513.wl014.sendgrid.net` |
| CNAME | `s2._domainkey.appconsole.tech` | `s2.domainkey.u56612513.wl014.sendgrid.net` |
| TXT | `_dmarc.appconsole.tech` | `v=DMARC1; p=none;` |

## Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

## Email Configuration

The application is configured to send emails from:
- **From Email**: `noreply@appconsole.tech`
- **From Name**: `Application Console`

## Features

The email service supports:
- Daily reminder emails with target progress
- Daily summary emails with application results
- Configurable notification times
- HTML email templates

## Testing

To test the email functionality:
1. Ensure all DNS records are properly configured
2. Set the `SENDGRID_API_KEY` environment variable
3. Configure email notifications in the application settings
4. Set up a daily target and schedule

## Troubleshooting

- Verify DNS records are properly propagated (can take up to 48 hours)
- Check SendGrid API key permissions
- Ensure the domain is verified in SendGrid dashboard
- Check application logs for email sending errors
