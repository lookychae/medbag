export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mediaType } = req.body;

  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: "이미지 데이터가 없습니다" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: `이 처방전 이미지를 분석해서 아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "hospital": "병원명",
  "doctor": "의사명 (없으면 빈 문자열)",
  "date": "YYYY-MM-DD 형식",
  "symptom": "증상/진단명",
  "child": "환자명 (나이 있으면 포함)",
  "medicines": [
    {
      "name": "약품명",
      "dosage": "1회 용량",
      "times": "하루 N회",
      "days": 숫자,
      "category": "해열진통제|항생제|거담제|항히스타민제|소화제|기관지확장제|스테로이드|외용제|유산균|기타 중 하나",
      "form": "시럽|분말|정제|캡슐|좌약|연고|흡입|점안|기타 중 하나",
      "comment": "복용 주의사항 (없으면 빈 문자열)"
    }
  ]
}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "AI 분석 실패" });
    }

    const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: "서버 오류: " + error.message });
  }
}
