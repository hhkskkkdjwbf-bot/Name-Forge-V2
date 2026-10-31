import unittest

from nameforge.scoring import SUPPORTED_LANGUAGES, comparison_key, rank_candidates, score_candidate


class ScoringTests(unittest.TestCase):
    def test_unicode_normalization(self):
        self.assertEqual(comparison_key("Café"), comparison_key("Cafe\u0301"))

    def test_duplicates_are_ranked_after_unique_names(self):
        ranked = rank_candidates(["Silver Harbor", "silver-harbor", "Bright Meadow"])
        self.assertTrue(ranked[-1].duplicate)
        self.assertLess(ranked[-1].score, ranked[0].score)

    def test_arabic_script_is_preferred_for_arabic_language(self):
        arabic = score_candidate("نور القمر", language="ar")
        latin = score_candidate("Noor Al Qamar", language="ar")
        self.assertGreater(arabic.score, latin.score)

    def test_28_supported_language_codes(self):
        self.assertEqual(len(SUPPORTED_LANGUAGES), 28)

    def test_empty_candidate(self):
        self.assertEqual(score_candidate("   ").score, 0.0)

    def test_preferred_length(self):
        exact = score_candidate("Nova", preferred_length=4)
        distant = score_candidate("Nova", preferred_length=15)
        self.assertGreater(exact.score, distant.score)


if __name__ == "__main__":
    unittest.main()
