import { z } from '@outputai/core';

// --- Valid recipe names ---

export const VALID_RECIPES = [
  'follow_up_email',
  'deal_brief',
  'meddic_score',
] as const;

export const ValidRecipeSchema = z.enum( VALID_RECIPES );

export type ValidRecipe = z.infer<typeof ValidRecipeSchema>;

// --- Recipe output schemas ---

const MeddicRatingSchema = z.enum( [ 'Strong', 'Partial', 'Gap' ] );

const MeddicDimensionSchema = z.object( {
  rating: MeddicRatingSchema,
  evidence: z.string().describe( 'Specific evidence from the call supporting this rating' ),
  gaps: z.string().optional().describe( 'What information is missing, if rating is Partial or Gap' ),
} );

export const MeddicScoreOutputSchema = z.object( {
  dimensions: z.object( {
    metrics: MeddicDimensionSchema,
    economic_buyer: MeddicDimensionSchema,
    decision_criteria: MeddicDimensionSchema,
    decision_process: MeddicDimensionSchema,
    identify_pain: MeddicDimensionSchema,
    champion: MeddicDimensionSchema,
  } ),
  gap_analysis: z.string().describe( 'Summary of weakest dimensions and deal risk' ),
  next_call_playbook: z.string().describe( 'Specific questions and tactics for the next call' ),
} );

export const DealBriefOutputSchema = z.object( {
  stakeholders: z.array( z.object( {
    name: z.string(),
    title: z.string(),
    role: z.string().describe( 'Role in deal: champion, economic buyer, end user, blocker, etc.' ),
    sentiment: z.string().describe( 'Observed sentiment toward the vendor' ),
  } ) ),
  pain_points: z.array( z.object( {
    pain: z.string(),
    urgency: z.enum( [ 'urgent', 'nice_to_have' ] ),
    evidence: z.string().describe( 'Quote or close paraphrase from the call' ),
  } ) ),
  competitors: z.array( z.object( {
    name: z.string(),
    sentiment: z.string(),
    positioning: z.string(),
  } ) ),
  objections: z.array( z.object( {
    objection: z.string(),
    type: z.enum( [ 'explicit', 'implicit' ] ),
    handling: z.string().describe( 'How it was addressed in the call' ),
    resolved: z.boolean(),
  } ) ),
  decision_process: z.object( {
    timeline: z.string(),
    approvers: z.string(),
    procurement_steps: z.string(),
    criteria: z.string(),
  } ),
  next_steps: z.array( z.object( {
    action: z.string(),
    owner: z.string(),
    deadline: z.string().optional(),
  } ) ),
} );

export const FollowUpEmailOutputSchema = z.object( {
  recipient_name: z.string().describe( 'Name of the primary prospect to address' ),
  email_body: z.string().describe( 'The full email body text' ),
} );

export const RECIPE_SCHEMAS: Record<ValidRecipe, z.ZodType> = {
  meddic_score: MeddicScoreOutputSchema,
  deal_brief: DealBriefOutputSchema,
  follow_up_email: FollowUpEmailOutputSchema,
};

// --- Workflow input/output ---

export const inputSchema = z.object( {
  transcript: z
    .string()
    .min( 50, 'Transcript must be at least 50 characters' )
    .describe( 'Raw sales call transcript text' ),
  recipes: z
    .array( ValidRecipeSchema )
    .optional()
    .describe(
      'Recipe names to run. If omitted the workflow auto-classifies the meeting and selects recipes.'
    ),
} );

export const RecipeResultSchema = z.object( {
  recipeName: ValidRecipeSchema,
  content: z.unknown().describe( 'Structured JSON output specific to the recipe type' ),
} );

export const outputSchema = z.object( {
  notes: z.string(),
  meetingType: z
    .string()
    .optional()
    .describe( 'Present only when auto-classification ran' ),
  recipes: z.array( RecipeResultSchema ),
} );

export type WorkflowInput = z.infer<typeof inputSchema>;
export type WorkflowOutput = z.infer<typeof outputSchema>;

// --- Step schemas ---

export const ExtractNotesInputSchema = z.object( {
  transcript: z.string(),
} );

export const ExtractNotesOutputSchema = z.object( {
  notes: z
    .string()
    .describe( 'Compact third-person past-tense meeting notes in journalist prose style' ),
} );

export type ExtractNotesInput = z.infer<typeof ExtractNotesInputSchema>;
export type ExtractNotesOutput = z.infer<typeof ExtractNotesOutputSchema>;

export const ClassifyMeetingInputSchema = z.object( {
  notes: z.string(),
} );

export const ClassifyMeetingOutputSchema = z.object( {
  meetingType: z
    .string()
    .describe( 'Detected meeting type, e.g. "discovery", "negotiation", "pipeline_review"' ),
  recipes: z
    .array( ValidRecipeSchema )
    .min( 1 )
    .describe( 'Recommended recipe names based on meeting type' ),
} );

export type ClassifyMeetingInput = z.infer<typeof ClassifyMeetingInputSchema>;
export type ClassifyMeetingOutput = z.infer<typeof ClassifyMeetingOutputSchema>;

export const ProcessRecipeInputSchema = z.object( {
  notes: z.string(),
  transcript: z.string(),
  recipeName: ValidRecipeSchema,
} );

export const ProcessRecipeOutputSchema = RecipeResultSchema;

export type ProcessRecipeInput = z.infer<typeof ProcessRecipeInputSchema>;
export type ProcessRecipeOutput = z.infer<typeof ProcessRecipeOutputSchema>;
