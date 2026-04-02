import { step, z } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import { matchPerson } from '../../shared/clients/apollo.js';
import { extractionResultSchema, participantSchema, enrichedParticipantSchema } from './types.js';
import type { ExtractionResult, EnrichedParticipant } from './types.js';

export const extractActionItems = step( {
  name: 'extract_action_items',
  description: 'Extract action items, participants, and summary from a call transcript using LLM',
  inputSchema: z.object( {
    transcript: z.string()
  } ),
  outputSchema: extractionResultSchema,
  fn: async ( { transcript } ): Promise<ExtractionResult> => {
    const { output } = await generateText( {
      prompt: 'extract_actions@v1',
      variables: { transcript },
      output: Output.object( { schema: extractionResultSchema } )
    } );

    return output as ExtractionResult;
  }
} );

export const enrichParticipants = step( {
  name: 'enrich_participants',
  description: 'Enrich participant contact info using Apollo People Match API',
  inputSchema: z.object( {
    participants: z.array( participantSchema )
  } ),
  outputSchema: z.object( {
    participants: z.array( enrichedParticipantSchema )
  } ),
  fn: async ( { participants } ): Promise<{ participants: EnrichedParticipant[] }> => {
    const enriched: EnrichedParticipant[] = [];

    for ( const participant of participants ) {
      if ( !participant.email ) {
        enriched.push( { ...participant } );
        continue;
      }

      try {
        const result = await matchPerson( { email: participant.email } );
        const p = result.person;

        enriched.push( {
          ...participant,
          title: p?.title ?? undefined,
          linkedinUrl: p?.linkedin_url ?? undefined,
          organizationName: p?.organization?.name ?? participant.company ?? undefined,
          organizationIndustry: p?.organization?.industry ?? undefined
        } );
      } catch {
        enriched.push( { ...participant } );
      }
    }

    return { participants: enriched };
  }
} );
