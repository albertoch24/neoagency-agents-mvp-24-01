interface FeedbackPoint {
  id: string;
  content: string;
  type: 'revision' | 'improvement' | 'correction';
  isAddressed: boolean;
}

function determinePointType(point: string): 'revision' | 'improvement' | 'correction' {
  const lowerPoint = point.toLowerCase();
  
  if (lowerPoint.includes('fix') || lowerPoint.includes('correct') || lowerPoint.includes('wrong')) {
    return 'correction';
  }
  if (lowerPoint.includes('improve') || lowerPoint.includes('enhance') || lowerPoint.includes('better')) {
    return 'improvement';
  }
  return 'revision';
}

export function parseFeedback(feedback: string): FeedbackPoint[] {
  console.log('🔍 Parsing feedback:', feedback);

  if (!feedback?.trim()) {
    console.log('⚠️ Empty feedback received');
    return [];
  }

  // Split feedback into sentences
  const points = feedback
    .split(/[.!?]/)
    .filter(point => point.trim().length > 0)
    .map((point, index) => {
      const parsedPoint = {
        id: `point-${index}`,
        content: point.trim(),
        type: determinePointType(point),
        isAddressed: false
      };

      console.log(`✅ Parsed feedback point ${index + 1}:`, parsedPoint);
      return parsedPoint;
    });

  console.log(`📊 Total feedback points parsed: ${points.length}`);
  return points;
}

export function validateFeedbackPoints(points: FeedbackPoint[]): boolean {
  if (!Array.isArray(points) || points.length === 0) {
    console.log('❌ No valid feedback points found');
    return false;
  }

  const validPoints = points.every(point => 
    point.id && 
    point.content && 
    ['revision', 'improvement', 'correction'].includes(point.type)
  );

  console.log(`🔍 Feedback points validation: ${validPoints ? 'passed' : 'failed'}`);
  return validPoints;
}