// Fallback analysis if Gemini is unavailable
export async function fallbackAnalysis(content: string, type: string) {
    let textToAnalyze = content;
    if (type === 'image') textToAnalyze = "Image Content Uploaded";
    
    // Extract keywords (very basic)
    const words = textToAnalyze.substring(0, 200).replace(/[.,!?]/g, '').split(' ')
        .filter(w => w.length > 4)
        .slice(0, 3);
    
    let supportingEvidence: string[] = [];
    let sourcesVerified: string[] = [];
    let foundInformation = false;

    // Try Google Fact Check API (it may fail with 403, but we try)
    try {
        const fcUrl = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(words.join(' '))}&key=${process.env.GEMINI_API_KEY || ''}`;
        const fcRes = await fetch(fcUrl);
        if (fcRes.ok) {
            const data: any = await fcRes.json();
            if (data.claims && data.claims.length > 0) {
                foundInformation = true;
                data.claims.slice(0, 2).forEach((c: any) => {
                    if (c.claimReview && c.claimReview.length > 0) {
                        const review = c.claimReview[0];
                        supportingEvidence.push(`Fact Check (${review.publisher.name}): ${review.textualRating}`);
                        sourcesVerified.push(review.url || review.publisher.name);
                    }
                });
            }
        }
    } catch (e) {
        // Ignore
    }

    // Try Wikipedia fallback
    if (!foundInformation && words.length > 0) {
        try {
            const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(words.join(' '))}&utf8=&format=json`;
            const wikiRes = await fetch(wikiUrl);
            if (wikiRes.ok) {
                const data: any = await wikiRes.json();
                if (data.query && data.query.search && data.query.search.length > 0) {
                    foundInformation = true;
                    data.query.search.slice(0, 2).forEach((s: any) => {
                        const snippet = s.snippet.replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML
                        supportingEvidence.push(`Wikipedia indicates: ${snippet}...`);
                        sourcesVerified.push(`Wikipedia: ${s.title}`);
                    });
                }
            }
        } catch (e) {
            // Ignore
        }
    }

    if (foundInformation) {
        return {
            verdict: "Mixed",
            truthPercentage: 50,
            falsePercentage: 50,
            confidenceScore: 60,
            credibilityScore: 50,
            riskLevel: "Medium",
            explanation: "Based on our fallback verification sources, we found some matching context. However, a deep AI analysis could not be completed at this moment.",
            factCheckSummary: "Review the evidence found in external encyclopedias and fact-check databases.",
            supportingEvidence: supportingEvidence,
            potentialConcerns: ["Analysis limited to keyword matching due to service limits.", "Claims need deeper manual review."],
            sourcesVerified: sourcesVerified.length > 0 ? sourcesVerified : ["Public Web Search"]
        };
    } else {
        return {
            verdict: "Insufficient Evidence",
            truthPercentage: 0,
            falsePercentage: 0,
            confidenceScore: 10,
            credibilityScore: 0,
            riskLevel: "Low",
            explanation: "We could not find sufficient reliable evidence to confirm or debunk this claim. It is highly recommended to seek professional fact-checking sources.",
            factCheckSummary: "No conclusive evidence found in trusted databases.",
            supportingEvidence: [],
            potentialConcerns: ["Lack of primary sources.", "Claim could not be verified online."],
            sourcesVerified: []
        };
    }
}
