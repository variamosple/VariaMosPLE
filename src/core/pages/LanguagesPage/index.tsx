import { useState } from "react";
import LanguageDetail from "../../components/LanguageDetail";
import LanguageManager from "../../components/LanguageManager";
import LanguagePageLayout from "../../components/LanguagePageLayout";
import LanguageReview from "../../components/LanguageReview";
import { Language } from "../../../Domain/ProductLineEngineering/Entities/Language";

export default function LanguagePage() {
  const [language, setLanguage] = useState<Language | null>(null);
  const [isCreatingLanguage, setCreatingLanguage] = useState(false);
  const [requestLanguages, setRequestLanguages] = useState(false);

  return (
    <LanguagePageLayout>
      <LanguageManager
        setLanguage={setLanguage}
        setCreatingLanguage={setCreatingLanguage}
        requestLanguages={requestLanguages}
        setRequestLanguages={setRequestLanguages}
      />
      <LanguageDetail
        language={language}
        isCreatingLanguage={isCreatingLanguage}
        setRequestLanguages={setRequestLanguages}
      />
      <LanguageReview />
    </LanguagePageLayout>
  );
}
