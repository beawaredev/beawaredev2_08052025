import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ExternalLink } from "lucide-react";

interface Book {
  id: number;
  title: string;
  author?: string | null;
  description?: string | null;
  link: string;
  cover_image_url?: string | null;
}

export default function Books() {
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <Card key={i} className="mb-4">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[180px] w-full mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-5/6" />
          </CardContent>
        </Card>
      ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Books</h1>
        <p className="text-muted-foreground mt-1">
          Books published by BeAware to help kids and families stay safe online.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          renderSkeletons()
        ) : !books || books.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No books available yet</h3>
            <p className="text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          books.map((book) => (
            <Card key={book.id} className="flex flex-col overflow-hidden">
              {book.cover_image_url && (
                <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{book.title}</CardTitle>
                {book.author && (
                  <CardDescription>by {book.author}</CardDescription>
                )}
              </CardHeader>
              {book.description && (
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {book.description}
                  </p>
                </CardContent>
              )}
              <CardFooter>
                <Button asChild className="w-full">
                  <a href={book.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> View Book
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
