import { workflow } from '@outputai/core';
import { extractNotes, classifyMeeting, processRecipe } from './steps.js';
import { inputSchema, outputSchema } from './types.js';

export default workflow( {
  name: 'sales_call_processor',
  description: 'Process a sales call transcript into notes and parallel recipe analyses',
  inputSchema,
  outputSchema,
  fn: async input => {
    // Step 1 — Extract clean meeting notes from the raw transcript
    const { notes } = await extractNotes( { transcript: input.transcript } );

    // Step 2 — Classify meeting type and auto-select recipes if not provided
    const classification = ( !input.recipes || input.recipes.length === 0 ) ?
      await classifyMeeting( { notes } ) :
      null;

    const recipes = classification ? classification.recipes : input.recipes!;
    const meetingType: string | undefined = classification?.meetingType;

    // Step 3 — Run each recipe in parallel
    const recipeResults = await Promise.all(
      recipes.map( recipeName =>
        processRecipe( {
          notes,
          transcript: input.transcript,
          recipeName
        } )
      )
    );

    return {
      notes,
      ...( meetingType ? { meetingType } : {} ),
      recipes: recipeResults
    };
  }
} );
