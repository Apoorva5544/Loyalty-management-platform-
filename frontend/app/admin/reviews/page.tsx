"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Star, User, Calendar, MessageSquare, Award } from "lucide-react";

interface Review {
  id: string;
  user: {
    email: string;
    name: string;
    points: number;
  };
  rating: number;
  comment: string;
  product: string;
  created_at: string;
  anonymous_id?: string;
}

interface ReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [awardingPoints, setAwardingPoints] = useState<string | null>(null);

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const response: ReviewsResponse = await apiClient.get(`/api/admin/reviews?page=${page}&limit=20`);
      setReviews(response.data);
      setTotalPages(Math.ceil(response.total / response.limit));
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const awardPoints = async (userEmail: string, points: number, reason: string) => {
    try {
      setAwardingPoints(userEmail);
      await apiClient.post("/api/admin/award-points", {
        user_email: userEmail,
        points: points,
        reason: reason
      });
      
      // Refresh reviews to show updated user points
      await fetchReviews(currentPage);
      alert(`Successfully awarded ${points} points!`);
    } catch (error) {
      console.error("Failed to award points:", error);
      alert("Failed to award points. Please try again.");
    } finally {
      setAwardingPoints(null);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Reviews</h1>
        <p className="text-gray-600">
          Manage customer reviews and award points for valuable feedback
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500">
            Customer reviews will appear here once they start submitting feedback.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {review.user.name || "Anonymous User"}
                      </h3>
                      <p className="text-sm text-gray-500">{review.user.email}</p>
                      <p className="text-xs text-blue-600 font-medium">
                        {review.user.points} points
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {renderStars(review.rating)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                </div>

                {review.product && (
                  <div className="mb-3">
                    <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      Product: {review.product}
                    </span>
                  </div>
                )}

                {review.comment && (
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                )}

                {review.user.email !== "Anonymous" && (
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => awardPoints(review.user.email, 50, "Review bonus points")}
                      disabled={awardingPoints === review.user.email}
                      className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      <Award className="w-4 h-4" />
                      <span>
                        {awardingPoints === review.user.email ? "Awarding..." : "Award 50 pts"}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => awardPoints(review.user.email, 100, "Excellent review bonus")}
                      disabled={awardingPoints === review.user.email}
                      className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Award className="w-4 h-4" />
                      <span>
                        {awardingPoints === review.user.email ? "Awarding..." : "Award 100 pts"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => fetchReviews(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => fetchReviews(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}