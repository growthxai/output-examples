import { z } from '@outputai/core';

export const workflowInputSchema = z.object( {
  email: z.string().email().optional().describe( 'Email address of the lead' ),
  linkedinUrl: z.string().url().optional().describe( 'LinkedIn profile URL of the lead' )
} ).refine(
  ( data ) => data.email || data.linkedinUrl,
  { message: 'At least one of email or linkedinUrl must be provided' }
);

export const personProfileSchema = z.object( {
  firstName: z.string(),
  lastName: z.string(),
  title: z.string().optional(),
  email: z.string().email().optional(),
  linkedinUrl: z.string().url().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  organizationName: z.string().optional(),
  organizationWebsite: z.string().optional(),
  organizationIndustry: z.string().optional(),
  organizationSize: z.string().optional()
} );

export const companyContextSchema = z.object( {
  websiteContent: z.string(),
  websiteUrl: z.string()
} );

export const personaClassificationSchema = z.object( {
  persona: z.enum( [
    'executive_buyer',
    'technical_evaluator',
    'end_user_champion',
    'operations_leader',
    'financial_decision_maker',
    'other'
  ] ),
  confidence: z.number(),
  reasoning: z.string()
} );

export const icebreakerSchema = z.object( {
  type: z.enum( [ 'role_based', 'company_based', 'industry_based', 'personal', 'mutual_connection' ] ),
  message: z.string(),
  reasoning: z.string()
} );

export const workflowOutputSchema = z.object( {
  person: personProfileSchema,
  companyContext: companyContextSchema.optional(),
  persona: personaClassificationSchema,
  icebreakers: z.array( icebreakerSchema )
} );

export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type PersonProfile = z.infer<typeof personProfileSchema>;
export type CompanyContext = z.infer<typeof companyContextSchema>;
export type PersonaClassification = z.infer<typeof personaClassificationSchema>;
export type Icebreaker = z.infer<typeof icebreakerSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
