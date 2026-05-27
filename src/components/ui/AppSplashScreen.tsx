import {
	Image,
	type ImageSourcePropType,
	StyleSheet,
	Text,
	View,
} from "react-native";

type FloatingBadgeProps = {
	imageSource: ImageSourcePropType;
	top?: number;
	left?: number;
	right?: number;
	bottom?: number;
	rotate?: string;
	opacity?: number;
};
const OPACITY = 0.25;
function FloatingBadge({
	imageSource,
	top,
	left,
	right,
	bottom,
	rotate = "0deg",
	opacity = OPACITY,
}: FloatingBadgeProps) {
	return (
		<View
			style={[
				styles.badge,
				{
					top,
					left,
					right,
					bottom,
					transform: [{ rotate }],
					opacity,
				},
			]}
		>
			<Image
				source={imageSource}
				style={styles.badgeImage}
				resizeMode="contain"
			/>
		</View>
	);
}

export function AppSplashScreen() {
	return (
		<View style={styles.container}>
			<FloatingBadge
				imageSource={{
					uri: "https://res.cloudinary.com/donrxmkyd/image/upload/v1778911975/netflix_txm2jd.png",
				}}
				top={94}
				left={50}
				opacity={OPACITY}
				rotate="-12deg"
			/>
			<FloatingBadge
				imageSource={{
					uri: "https://res.cloudinary.com/donrxmkyd/image/upload/v1778912098/youtube_ade9or.png",
				}}
				top={122}
				right={44}
				opacity={OPACITY}
				rotate="11deg"
			/>
			<FloatingBadge
				imageSource={{
					uri: "https://res.cloudinary.com/donrxmkyd/image/upload/v1778912439/primevideo_olngao.png",
				}}
				top={252}
				left={34}
				rotate="10deg"
				opacity={OPACITY}
			/>
			<FloatingBadge
				imageSource={{
					uri: "https://res.cloudinary.com/donrxmkyd/image/upload/v1778912098/DisneyLogo_gtwqwd.png",
				}}
				top={304}
				right={26}
				rotate="-8deg"
				opacity={OPACITY}
			/>
			<FloatingBadge
				imageSource={{
					uri: "https://res.cloudinary.com/donrxmkyd/image/upload/v1778912439/notion_wgzdcr.png",
				}}
				bottom={140}
				right={28}
				rotate="8deg"
				opacity={OPACITY}
			/>
			<FloatingBadge
				imageSource={{
					uri: "https://res.cloudinary.com/donrxmkyd/image/upload/v1778912439/spotify_mgr7eb.png",
				}}
				bottom={208}
				left={30}
				rotate="-10deg"
				opacity={OPACITY}
			/>

			<View style={styles.brandBlock}>
				<Image
					source={require("../../../assets/images/splash.png")}
					style={styles.logo}
					resizeMode="contain"
				/>
				<Text style={styles.title}>Recurvo</Text>
				<Text style={styles.subtitle}>
					Track subscriptions.{"\n"}
					<Text style={styles.subtitleAccent}>Avoid surprises.</Text>
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#020F4A",
	},
	brandBlock: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	logo: {
		width: 160,
		height: 160,
		marginBottom: 16,
		borderRadius: 32,
	},
	title: {
		fontFamily: "Poppins-Bold",
		fontSize: 56,
		lineHeight: 66,
		color: "#FFFFFF",
		letterSpacing: 0.4,
	},
	subtitle: {
		marginTop: 10,
		fontFamily: "Poppins-Medium",
		fontSize: 24,
		lineHeight: 34,
		color: "#E7EDFF",
		textAlign: "center",
	},
	subtitleAccent: {
		color: "#4D8BFF",
	},
	badge: {
		position: "absolute",
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 16,
		backgroundColor: "rgba(128, 163, 255, 0.14)",
		borderWidth: 1,
		borderColor: "rgba(144, 179, 255, 0.22)",
	},
	badgeImage: {
		width: 28,
		height: 28,
		borderRadius: 8,
	},
});
