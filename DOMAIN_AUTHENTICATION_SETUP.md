# SendGrid Domain Authentication Setup for appconsole.tech

## Step 1: Domain Authentication in SendGrid Dashboard

1. **Go to SendGrid Dashboard**: https://app.sendgrid.com/
2. **Navigate to**: Settings → Sender Authentication
3. **Click**: "Authenticate Your Domain"
4. **Enter Domain**: `appconsole.tech`
5. **Select DNS Provider**: Choose your DNS provider (or "Other" if not listed)
6. **Click**: "Next"

## Step 2: DNS Records to Add

SendGrid will provide you with specific DNS records. Based on your earlier setup, you'll need to add these records to your `appconsole.tech` domain:

### Required DNS Records:

```
Type: CNAME
Name: em4569
Value: u56612513.wl014.sendgrid.net

Type: CNAME  
Name: s1._domainkey
Value: s1.domainkey.u56612513.wl014.sendgrid.net

Type: CNAME
Name: s2._domainkey  
Value: s2.domainkey.u56612513.wl014.sendgrid.net

Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
```

## Step 3: Add Records to Your DNS Provider

1. **Log into your DNS provider** (where you manage appconsole.tech)
2. **Add each record** exactly as shown above
3. **Wait for propagation** (can take up to 48 hours)

## Step 4: Verify Domain in SendGrid

1. **Return to SendGrid Dashboard**
2. **Click**: "Verify" next to your domain
3. **Wait for verification** (usually takes a few minutes to hours)

## Step 5: Test Domain Email

Once verified, you can send emails from:
- `noreply@appconsole.tech`
- `support@appconsole.tech`
- `notifications@appconsole.tech`
- Any email address using your domain

## Troubleshooting

**If verification fails:**
- Check that DNS records are exactly as provided
- Wait longer for DNS propagation
- Use online DNS checker tools to verify records
- Contact your DNS provider if records aren't appearing

**Common Issues:**
- Records not propagated yet (wait 24-48 hours)
- Typos in DNS record values
- Wrong record types (CNAME vs TXT)
- DNS provider caching issues
