export interface Email {
  id: string;
  userId: string;
  googleId: string;
  threadId: string;
  sender: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  classification: 'SAFE' | 'SPAM' | 'PHISHING' | 'PROMOTIONAL';
  securityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  analyzedAt: string;
  analysis?: {
    evidence: string;
    spfResult: string;
    dkimResult: string;
    dmarcResult: string;
  };
}

export interface DashboardStats {
  stats: {
    totalEmails: number;
    byClassification: Record<string, number>;
    byRisk: Record<string, number>;
    avgSecurityScore: number;
    threats: number;
  };
  recentThreats: Email[];
}
