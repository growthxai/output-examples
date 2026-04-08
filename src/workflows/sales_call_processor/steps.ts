import { step } from '@outputai/core';
import { generateText, Output } from '@outputai/llm';
import {
  ExtractNotesInputSchema,
  ExtractNotesOutputSchema,
  ClassifyMeetingInputSchema,
  ClassifyMeetingOutputSchema,
  ProcessRecipeInputSchema,
  ProcessRecipeOutputSchema,
  RECIPE_SCHEMAS,
} from './types.js';

export const extractNotes = step( {
  name: 'extract_notes',
  description: 'Extract clean meeting notes from a raw sales call transcript',
  inputSchema: ExtractNotesInputSchema,
  outputSchema: ExtractNotesOutputSchema,
  fn: async ( { transcript } ) => {
    const { result } = await generateText( {
      prompt: 'extract_notes@v1',
      variables: { transcript }
    } );

    if ( !result || result.trim().length < 20 ) {
      throw new Error( 'Notes extraction produced empty or insufficient output' );
    }

    return { notes: result };
  }
} );

export const classifyMeeting = step( {
  name: 'classify_meeting',
  description: 'Classify meeting type and recommend recipes based on meeting notes',
  inputSchema: ClassifyMeetingInputSchema,
  outputSchema: ClassifyMeetingOutputSchema,
  fn: async ( { notes } ) => {
    const { output } = await generateText( {
      prompt: 'classify_meeting@v1',
      variables: { notes },
      output: Output.object( { schema: ClassifyMeetingOutputSchema } )
    } );

    if ( !output || !output.recipes || output.recipes.length === 0 ) {
      throw new Error( 'Classifier returned no recipes' );
    }

    return {
      meetingType: output.meetingType,
      recipes: output.recipes,
    };
  }
} );

export const processRecipe = step( {
  name: 'process_recipe',
  description: 'Run a dynamic recipe analysis using the recipe name as the prompt file',
  inputSchema: ProcessRecipeInputSchema,
  outputSchema: ProcessRecipeOutputSchema,
  fn: async ( { notes, transcript, recipeName } ) => {
    const schema = RECIPE_SCHEMAS[ recipeName ];

    const { output } = await generateText( {
      prompt: `${ recipeName }@v1`,
      variables: { notes, transcript },
      output: Output.object( { schema } )
    } );

    if ( !output ) {
      throw new Error( `Recipe "${ recipeName }" produced empty output` );
    }

    return {
      recipeName,
      content: output,
    };
  }
} );
