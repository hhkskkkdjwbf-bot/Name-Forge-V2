import unittest

from fastapi import HTTPException
from pydantic import ValidationError

from nameforge.api import RankRequest, health, rank


class ApiTests(unittest.TestCase):
    def test_health_endpoint_payload(self):
        self.assertEqual(health()["status"], "ok")

    def test_rank_endpoint_sorts_and_explains_candidates(self):
        response = rank(RankRequest(
            candidates=["Noor Al Qamar", "نور القمر", "Bright Meadow"],
            language="ar",
        ))
        self.assertEqual(response["count"], 3)
        self.assertEqual(response["results"][0]["name"], "نور القمر")
        self.assertIn("script_match", response["results"][0]["reasons"])

    def test_unsupported_language_is_rejected_at_request_validation(self):
        with self.assertRaises(ValidationError):
            RankRequest(candidates=["Nova"], language="latin")

    def test_candidate_batch_is_bounded(self):
        with self.assertRaises(ValidationError):
            RankRequest(candidates=["Nova"] * 101, language="en")

    def test_candidate_length_is_bounded(self):
        with self.assertRaises(ValidationError):
            RankRequest(candidates=["N" * 121], language="en")


if __name__ == "__main__":
    unittest.main()
