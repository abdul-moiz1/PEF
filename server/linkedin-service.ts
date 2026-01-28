import axios from 'axios';

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  headline?: string;
  location?: {
    country?: string;
    city?: string;
  };
  positions?: Array<{
    title: string;
    companyName: string;
    current: boolean;
  }>;
}

export class LinkedInService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
    const domain = process.env.REPLIT_DEV_DOMAIN || process.env.APP_DOMAIN || 'localhost:5000';
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    this.redirectUri = `${protocol}://${domain}/api/auth/linkedin/callback`;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: 'openid profile email',
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
    });

    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  }

  async getUserProfile(accessToken: string): Promise<LinkedInProfile> {
    try {
      // Get basic profile using OpenID Connect userinfo endpoint
      const userinfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const userinfo = userinfoResponse.data;

      // Parse the profile data from OpenID Connect response
      const profile: LinkedInProfile = {
        id: userinfo.sub,
        firstName: userinfo.given_name || '',
        lastName: userinfo.family_name || '',
        email: userinfo.email || '',
        profilePicture: userinfo.picture,
      };

      // Try to get additional profile data from v2 API
      try {
        const profileResponse = await axios.get(
          'https://api.linkedin.com/v2/me',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        );

        const linkedInProfile = profileResponse.data;
        
        // Extract localized fields if available
        if (linkedInProfile.headline?.localized) {
          const headlineValues = Object.values(linkedInProfile.headline.localized);
          if (headlineValues.length > 0) {
            profile.headline = headlineValues[0] as string;
          }
        }
      } catch (error) {
        console.warn('Could not fetch extended LinkedIn profile data:', error);
        // Continue with basic profile data
      }

      return profile;
    } catch (error: any) {
      console.error('Error fetching LinkedIn profile:', error.response?.data || error.message);
      throw new Error('Failed to fetch LinkedIn profile');
    }
  }
}

export const linkedInService = new LinkedInService();
