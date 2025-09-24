export default function FriendsListShimmerCard() {
	return (
		<div>
			<div className="friends-carousel-tile">
				<div>
					<div>
						<button type="button" className="options-dropdown" id="friend-tile-button">
							<div className="friend-tile-content">
								<div
									className="avatar avatar-card-fullbody"
									data-testid="avatar-card-container"
								>
									<span
										className="avatar-card-link"
										data-testid="avatar-card-link"
									>
										<span className="thumbnail-2d-container avatar-card-image shimmer" />
									</span>
								</div>
							</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
