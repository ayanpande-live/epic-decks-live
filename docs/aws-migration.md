# AWS static hosting migration — preparation only

Scope: Epic Decks static website and labs (including My Epic Decks and Trading Floor). Existing Lightsail applications and databases remain untouched.

## Target
- Region: eu-west-3 (Paris)
- Private S3 bucket with Block Public Access and default encryption
- CloudFront distribution with Origin Access Control (OAC), HTTPS and ACM certificate in us-east-1 for custom domains
- GitHub Actions with AWS IAM OIDC, least-privilege access, no stored AWS access keys
- A separate staging distribution/domain, with access restrictions before sharing sensitive previews

## Prerequisites (not provisioned by this commit)
1. Review AWS billing and enable cost alerts. Obtain explicit approval for any new billable resources.
2. Decide staging domain and production cutover plan. Do not change live DNS yet.
3. Create private S3 bucket, CloudFront OAC distribution, HTTPS settings, and dedicated IAM OIDC role limited to the GitHub repository and approved deployment branch/environment.
4. Configure GitHub environment `aws-staging` with required reviewers and variables:
   - `AWS_ROLE_ARN`
   - `AWS_STATIC_BUCKET`
   - `AWS_CLOUDFRONT_DISTRIBUTION_ID`
   - `AWS_REGION` (eu-west-3)
5. Review and approve workflow before first manual run.

## Deployment workflow
The workflow is manual-only (`workflow_dispatch`) and only accepts the dedicated feature branch. It syncs static repository files to S3 and invalidates CloudFront. No AWS actions run until GitHub variables and OIDC trust are configured and an authorized reviewer starts it.

## Pre-cutover verification
- Check all routes and assets, especially `/labs/my-epic-decks/` and `/labs/trading-floor/`.
- Translate Vercel redirects for privacy, cookies and legal notice into CloudFront Function or equivalent before website cutover.
- Test iOS PWA, service worker caching, browser storage, refresh/deep links, CORS, TLS, privacy pages, contact/enquiry flows.
- Export or migrate localStorage progress: browser storage is origin-scoped and will not automatically follow a new domain.
- Confirm no API credentials or private files are present in the published repository.
- Keep old hosting and DNS until staging sign-off and rollback test.

## Important security detail
The static Trading Floor has local progress only. S3/CloudFront alone does not provide private user accounts, access control or cloud saves. Use authenticated backend services for those features later.

## Rollback
Retain the prior distribution configuration and a versioned S3 release or backup. DNS cutover should occur only after an approved staging review; leave Vercel online until traffic and links have been checked.
