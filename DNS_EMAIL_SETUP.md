# DNS Configuration for Email Service

## Required DNS Records for support@athub.store

To properly configure email service for the domain `athub.store`, the following DNS records need to be added:

### MX Records (Mail Exchange)
| Hostname | Record Type | Priority | Value |
|----------|-------------|----------|-------|
| @        | MX          | 10       | mx1.privateemail.com |
| @        | MX          | 10       | mx2.privateemail.com |

### TXT Record (SPF)
| Hostname | Record Type | Value |
|----------|-------------|-------|
| @        | TXT         | v=spf1 include:spf.privateemail.com ~all |

## What These Records Do

1. **MX Records**: Tell email servers where to deliver emails for your domain
   - `mx1.privateemail.com` and `mx2.privateemail.com` are the mail servers
   - Priority 10 means they have equal priority (load balancing)

2. **SPF Record**: Prevents email spoofing
   - Allows only `spf.privateemail.com` to send emails on behalf of your domain
   - `~all` means soft fail - emails from other servers should be marked but not rejected

## Implementation Steps

1. **Log into your domain registrar** (where you bought athub.store)
2. **Find DNS management** section
3. **Add the MX records**:
   - Create first MX record: `@` → `mx1.privateemail.com` (Priority: 10)
   - Create second MX record: `@` → `mx2.privateemail.com` (Priority: 10)
4. **Add the TXT record**:
   - Create TXT record: `@` → `v=spf1 include:spf.privateemail.com ~all`
5. **Save changes** and wait up to 4 hours for propagation

## Verification

After DNS changes propagate:
1. Test sending an email to `support@athub.store`
2. Check if you can receive emails
3. Verify SPF record using online tools like `mxtoolbox.com`

## Notes

- These DNS settings are external and cannot be configured through the codebase
- The contact form will work once these DNS records are properly configured
- Email functionality in the app (`/contact` page) depends on these records being set up correctly
