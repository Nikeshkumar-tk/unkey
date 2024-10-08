package ratelimit

import (
	"context"
	"time"

	ratelimitv1 "github.com/unkeyed/unkey/apps/agent/gen/proto/ratelimit/v1"
	"github.com/unkeyed/unkey/apps/agent/pkg/ratelimit"
)

func (s *service) PushPull(ctx context.Context, req *ratelimitv1.PushPullRequest) (*ratelimitv1.PushPullResponse, error) {

	res := &ratelimitv1.PushPullResponse{
		Updates: make([]*ratelimitv1.PushPullUpdate, len(req.Events)),
	}
	for i, e := range req.Events {
		r := s.ratelimiter.Take(ctx, ratelimit.RatelimitRequest{
			Identifier: e.Identifier,
			Limit:      e.Limit,
			Duration:   time.Duration(e.Duration) * time.Millisecond,
			Cost:       e.Cost,
		})

		res.Updates[i] = &ratelimitv1.PushPullUpdate{
			Identifier: e.Identifier,
			Current:    r.Current,
		}

		// Report accuracy of ratelimiting decisions by comparing the returned ratelimit to the origin ratelimit
		if e.Pass == r.Pass {
			ratelimitAccuracy.WithLabelValues("true").Inc()
		} else {
			ratelimitAccuracy.WithLabelValues("false").Inc()

		}

	}

	return res, nil

}
