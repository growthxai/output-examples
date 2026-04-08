import { workflow } from '@outputai/core';
import { extractNotes, classifyMeeting, processRecipe } from './steps.js';
import { inputSchema, outputSchema } from './types.js';

export default workflow( {
  name: 'sales_call_processor',
  description: 'Process a sales call transcript into notes and parallel recipe analyses',
  inputSchema,
  outputSchema,
  fn: async ( input ) => {
    // Step 1 — Extract clean meeting notes from the raw transcript
    const { notes } = await extractNotes( { transcript: input.transcript } );

    // Step 2 — Classify meeting type and auto-select recipes if not provided
    let recipes = input.recipes;
    let meetingType: string | undefined;

    if ( !recipes || recipes.length === 0 ) {
      const classification = await classifyMeeting( { notes } );
      recipes = classification.recipes;
      meetingType = classification.meetingType;
    }

    // Step 3 — Run each recipe in parallel
    const recipeResults = await Promise.all(
      recipes.map( ( recipeName ) =>
        processRecipe( {
          notes,
          transcript: input.transcript,
          recipeName,
        } )
      )
    );

    return {
      notes,
      ...( meetingType ? { meetingType } : {} ),
      recipes: recipeResults,
    };
  },
} );
